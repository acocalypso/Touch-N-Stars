package com.TouchNStars.dev;

import android.content.Context;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MediaScanner")
public class MediaScannerPlugin extends Plugin {
    private static final String TAG = "MediaScannerPlugin";

    @PluginMethod
    public void scanFile(PluginCall call) {
        String filePath = call.getString("path");

        if (filePath == null || filePath.isEmpty()) {
            call.reject("File path is required");
            return;
        }

        Context context = getContext();

        MediaScannerConnection.scanFile(
            context,
            new String[]{filePath},
            new String[]{"image/jpeg"},
            new MediaScannerConnection.OnScanCompletedListener() {
                @Override
                public void onScanCompleted(String path, Uri uri) {
                    Log.d(TAG, "Media scan completed for: " + path);
                    Log.d(TAG, "URI: " + uri);

                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("path", path);
                    if (uri != null) {
                        result.put("uri", uri.toString());
                    }
                    call.resolve(result);
                }
            }
        );
    }
}
