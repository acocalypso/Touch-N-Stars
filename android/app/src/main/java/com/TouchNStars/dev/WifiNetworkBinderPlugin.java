package com.TouchNStars.dev;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.InetAddresses;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.net.Inet4Address;
import java.net.InetAddress;

/**
 * Binds the app process to the connected Wi-Fi network whenever the active
 * backend instance IP lives inside that network's subnet.
 *
 * Background: the PINS fallback hotspot intentionally provides no internet
 * (no gateway/DNS), so Android keeps cellular as the default network. All
 * WebView traffic (HTTP + WebSockets) follows the default route and can no
 * longer reach the hotspot subnet (e.g. 10.42.0.x). Binding the whole process
 * to the Wi-Fi network restores connectivity to the backend while the rest of
 * the phone keeps using cellular for internet.
 *
 * The NetworkRequest must NOT require NET_CAPABILITY_INTERNET (the builder
 * adds it by default), otherwise the internet-less hotspot never matches.
 */
@CapacitorPlugin(name = "WifiNetworkBinder")
public class WifiNetworkBinderPlugin extends Plugin {
    private static final String TAG = "WifiNetworkBinder";

    private ConnectivityManager connectivityManager;
    private ConnectivityManager.NetworkCallback networkCallback;
    private Network wifiNetwork;
    private String targetIp;
    private boolean bound = false;

    @PluginMethod
    public void setTargetIp(PluginCall call) {
        String ip = call.getString("ip");
        if (ip == null || ip.isEmpty()) {
            call.reject("ip is required");
            return;
        }

        synchronized (this) {
            targetIp = ip;
            ensureCallbackRegistered();
            evaluateBinding();
        }
        call.resolve(buildStatus());
    }

    @PluginMethod
    public void disable(PluginCall call) {
        synchronized (this) {
            targetIp = null;
            unregisterCallbackAndUnbind();
        }
        call.resolve(buildStatus());
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(buildStatus());
    }

    @Override
    protected void handleOnDestroy() {
        synchronized (this) {
            unregisterCallbackAndUnbind();
        }
        super.handleOnDestroy();
    }

    private ConnectivityManager getConnectivityManager() {
        if (connectivityManager == null) {
            connectivityManager =
                (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        }
        return connectivityManager;
    }

    /**
     * Registers a long-lived network request for any Wi-Fi network. Besides
     * delivering callbacks, the active request tells Android the app needs the
     * unvalidated Wi-Fi, which keeps the system from dropping it.
     */
    private void ensureCallbackRegistered() {
        if (networkCallback != null) {
            return;
        }

        NetworkRequest request = new NetworkRequest.Builder()
            .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
            // The builder requires NET_CAPABILITY_INTERNET by default; the PINS
            // hotspot has none, so the capability must be removed explicitly.
            .removeCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build();

        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                synchronized (WifiNetworkBinderPlugin.this) {
                    wifiNetwork = network;
                    evaluateBinding();
                }
            }

            @Override
            public void onLinkPropertiesChanged(Network network, LinkProperties linkProperties) {
                synchronized (WifiNetworkBinderPlugin.this) {
                    wifiNetwork = network;
                    evaluateBinding();
                }
            }

            @Override
            public void onLost(Network network) {
                synchronized (WifiNetworkBinderPlugin.this) {
                    if (network.equals(wifiNetwork)) {
                        wifiNetwork = null;
                        evaluateBinding();
                    }
                }
            }
        };

        try {
            getConnectivityManager().requestNetwork(request, networkCallback);
            Log.d(TAG, "Wi-Fi network request registered");
        } catch (SecurityException e) {
            Log.e(TAG, "Failed to request Wi-Fi network (missing CHANGE_NETWORK_STATE?)", e);
            networkCallback = null;
        }
    }

    /**
     * Binds the process to the Wi-Fi network if the target IP is inside one of
     * its subnets, otherwise removes any existing binding.
     */
    private void evaluateBinding() {
        boolean shouldBind = false;

        if (targetIp != null && wifiNetwork != null) {
            LinkProperties linkProperties = getConnectivityManager().getLinkProperties(wifiNetwork);
            shouldBind = linkProperties != null && isIpInWifiSubnet(targetIp, linkProperties);
        }

        if (shouldBind && !bound) {
            bound = getConnectivityManager().bindProcessToNetwork(wifiNetwork);
            Log.i(TAG, "Process bound to Wi-Fi for " + targetIp + ": " + bound);
        } else if (!shouldBind && bound) {
            getConnectivityManager().bindProcessToNetwork(null);
            bound = false;
            Log.i(TAG, "Process network binding removed");
        } else if (shouldBind) {
            // Wi-Fi network instance may have changed while staying bound
            getConnectivityManager().bindProcessToNetwork(wifiNetwork);
        }
    }

    private void unregisterCallbackAndUnbind() {
        if (networkCallback != null) {
            try {
                getConnectivityManager().unregisterNetworkCallback(networkCallback);
            } catch (IllegalArgumentException e) {
                Log.w(TAG, "Network callback was already unregistered", e);
            }
            networkCallback = null;
        }
        if (bound) {
            getConnectivityManager().bindProcessToNetwork(null);
            bound = false;
        }
        wifiNetwork = null;
    }

    private JSObject buildStatus() {
        JSObject status = new JSObject();
        synchronized (this) {
            status.put("bound", bound);
            status.put("targetIp", targetIp);
        }
        return status;
    }

    /**
     * Checks whether the target address (numeric IPv4 only — hostnames cannot
     * be resolved without a network round trip) falls into one of the Wi-Fi
     * link's IPv4 prefixes.
     */
    private static boolean isIpInWifiSubnet(String targetIp, LinkProperties linkProperties) {
        if (!InetAddresses.isNumericAddress(targetIp)) {
            return false;
        }
        InetAddress target = InetAddresses.parseNumericAddress(targetIp);
        if (!(target instanceof Inet4Address)) {
            return false;
        }

        for (LinkAddress linkAddress : linkProperties.getLinkAddresses()) {
            InetAddress address = linkAddress.getAddress();
            if (!(address instanceof Inet4Address)) {
                continue;
            }
            if (isInSamePrefix(target.getAddress(), address.getAddress(), linkAddress.getPrefixLength())) {
                return true;
            }
        }
        return false;
    }

    private static boolean isInSamePrefix(byte[] a, byte[] b, int prefixLength) {
        int intA = bytesToInt(a);
        int intB = bytesToInt(b);
        int mask = prefixLength <= 0 ? 0 : (int) (0xFFFFFFFFL << (32 - prefixLength));
        return (intA & mask) == (intB & mask);
    }

    private static int bytesToInt(byte[] bytes) {
        return ((bytes[0] & 0xFF) << 24)
            | ((bytes[1] & 0xFF) << 16)
            | ((bytes[2] & 0xFF) << 8)
            | (bytes[3] & 0xFF);
    }
}
