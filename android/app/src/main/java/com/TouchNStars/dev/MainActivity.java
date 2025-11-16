package com.TouchNStars.dev;

import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register MediaScanner plugin for gallery integration
        registerPlugin(MediaScannerPlugin.class);
    }

    @Override
    public void onDestroy() {
        super.onDestroy(); 
    }

    @Override
    public void onBackPressed() {
        // Show confirmation dialog before exiting
        new android.app.AlertDialog.Builder(this)
            .setTitle("Exit Application")
            .setMessage("Are you sure you want to close Touch'N'Stars?")
            .setPositiveButton("Yes", (dialog, which) -> {
                // Exit the app
                if (android.os.Build.VERSION.SDK_INT >= 33) {
                    finishAfterTransition();
                } else {
                    super.onBackPressed();
                }
            })
            .setNegativeButton("No", null)
            .show();
    }
}
