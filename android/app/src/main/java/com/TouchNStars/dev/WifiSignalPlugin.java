package com.TouchNStars.dev;

import android.Manifest;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "WifiSignal",
    permissions = {
        @Permission(alias = "location", strings = { Manifest.permission.ACCESS_FINE_LOCATION })
    }
)
public class WifiSignalPlugin extends Plugin {
    private static final String TAG = "WifiSignalPlugin";

    @PluginMethod
    public void getCurrent(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "locationPermsCallback");
            return;
        }

        resolveCurrent(call);
    }

    @PermissionCallback
    private void locationPermsCallback(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            JSObject result = baseResult();
            result.put("available", false);
            result.put("reason", "location-permission-denied");
            call.resolve(result);
            return;
        }

        resolveCurrent(call);
    }

    private void resolveCurrent(PluginCall call) {
        WifiInfo wifiInfo = readWifiInfo();
        JSObject result = baseResult();

        if (wifiInfo == null) {
            result.put("available", false);
            result.put("reason", "wifi-unavailable");
            Log.d(TAG, "WiFi signal unavailable: no WifiInfo");
            call.resolve(result);
            return;
        }

        int rssi = wifiInfo.getRssi();
        String ssid = cleanSsid(wifiInfo.getSSID());
        String bssid = cleanBssid(wifiInfo.getBSSID());
        Log.d(TAG, "WiFi signal snapshot: rssi=" + rssi + ", ssid=" + ssid + ", bssid=" + bssid);

        if (!isCredibleRssi(rssi)) {
            result.put("available", false);
            result.put("reason", "signal-unavailable");
            result.put("rssiDbm", rssi);
            result.put("ssid", ssid);
            result.put("bssid", bssid);
            result.put("frequency", wifiInfo.getFrequency());
            result.put("linkSpeedMbps", wifiInfo.getLinkSpeed());
            call.resolve(result);
            return;
        }

        int signalStrength = rssiToPercent(rssi);
        result.put("available", true);
        result.put("rssiDbm", rssi);
        result.put("signalStrength", signalStrength);
        result.put("quality", signalStrength + "/100");
        result.put("ssid", ssid);
        result.put("bssid", bssid);
        result.put("frequency", wifiInfo.getFrequency());
        result.put("linkSpeedMbps", wifiInfo.getLinkSpeed());
        call.resolve(result);
    }

    private JSObject baseResult() {
        JSObject result = new JSObject();
        result.put("platform", "android");
        result.put("source", "mobile-device");
        return result;
    }

    private WifiInfo readWifiInfo() {
        Context context = getContext().getApplicationContext();
        WifiInfo managerInfo = null;
        WifiInfo capabilitiesInfo = null;

        WifiManager wifiManager = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
        if (wifiManager != null) {
            managerInfo = wifiManager.getConnectionInfo();
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            ConnectivityManager connectivityManager =
                (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
            if (connectivityManager != null) {
                Network activeNetwork = connectivityManager.getActiveNetwork();
                NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(activeNetwork);
                if (capabilities != null && capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                    Object transportInfo = capabilities.getTransportInfo();
                    if (transportInfo instanceof WifiInfo) {
                        capabilitiesInfo = (WifiInfo) transportInfo;
                    }
                }
            }
        }

        if (hasCredibleWifiInfo(managerInfo)) {
            return managerInfo;
        }
        if (hasCredibleWifiInfo(capabilitiesInfo)) {
            return capabilitiesInfo;
        }
        return managerInfo != null ? managerInfo : capabilitiesInfo;
    }

    private int rssiToPercent(int rssi) {
        int clamped = Math.max(-100, Math.min(-50, rssi));
        return Math.max(0, Math.min(100, 2 * (clamped + 100)));
    }

    private boolean hasCredibleWifiInfo(WifiInfo wifiInfo) {
        return wifiInfo != null && isCredibleRssi(wifiInfo.getRssi());
    }

    private boolean isCredibleRssi(int rssi) {
        return rssi > -100 && rssi < 0;
    }

    private String cleanSsid(String ssid) {
        if (ssid == null || ssid.isEmpty() || "<unknown ssid>".equals(ssid)) {
            return null;
        }
        if (ssid.length() >= 2 && ssid.startsWith("\"") && ssid.endsWith("\"")) {
            return ssid.substring(1, ssid.length() - 1);
        }
        return ssid;
    }

    private String cleanBssid(String bssid) {
        if (bssid == null || bssid.isEmpty() || "02:00:00:00:00:00".equals(bssid)) {
            return null;
        }
        return bssid;
    }
}
