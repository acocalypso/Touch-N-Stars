import Capacitor
import NetworkExtension

@objc(WifiSignalPlugin)
public class WifiSignalPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WifiSignalPlugin"
    public let jsName = "WifiSignal"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getCurrent", returnType: CAPPluginReturnPromise)
    ]

    @objc func getCurrent(_ call: CAPPluginCall) {
        if #available(iOS 14.0, *) {
            NEHotspotNetwork.fetchCurrent { network in
                var result: [String: Any] = [
                    "platform": "ios",
                    "source": "mobile-device"
                ]

                guard let network = network else {
                    result["available"] = false
                    result["reason"] = "permission-or-entitlement-unavailable"
                    call.resolve(result)
                    return
                }

                let normalizedSignal = max(0.0, min(1.0, network.signalStrength))
                let signalStrength = Int((normalizedSignal * 100.0).rounded())

                result["available"] = signalStrength > 0
                result["ssid"] = network.ssid
                result["bssid"] = network.bssid
                result["signalStrength"] = signalStrength
                result["quality"] = "\(signalStrength)/100"
                if signalStrength == 0 {
                    result["reason"] = "signal-unavailable"
                }
                call.resolve(result)
            }
        } else {
            call.resolve([
                "available": false,
                "platform": "ios",
                "reason": "ios-version-unsupported",
                "source": "mobile-device"
            ])
        }
    }
}
