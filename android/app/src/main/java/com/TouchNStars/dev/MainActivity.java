package com.TouchNStars.dev;

import android.os.Bundle;
import android.content.pm.PackageManager;
import android.content.Intent;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import android.view.WindowManager;
import android.app.KeyguardManager;
import android.content.Context;
import android.os.PowerManager;
import android.provider.Settings;
import android.net.Uri;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureWakeFeatures();
    }

    private void configureWakeFeatures() {
        // Allow screen to turn off normally
        // getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // Remove lock screen bypass - require normal unlock
        // if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
        //     setShowWhenLocked(true);
        //     setTurnScreenOn(true);
        //     
        //     // For Android 10+, request to disable power button instant lock
        //     if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
        //         KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
        //         keyguardManager.requestDismissKeyguard(this, null);
        //     }
        // } else {
        //     getWindow().addFlags(
        //             WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
        //             WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        //     );
        // }
        
        // Request battery optimization exemption for long astronomy sessions
        requestBatteryOptimizationExemption();
    }

    private void requestBatteryOptimizationExemption() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            Intent intent = new Intent();
            String packageName = getPackageName();
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + packageName));
                startActivity(intent);
            }
        }
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
