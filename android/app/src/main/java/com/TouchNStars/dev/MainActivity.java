package com.TouchNStars.dev;

import android.os.Bundle;
import android.content.pm.PackageManager;
import android.content.Intent;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import android.view.WindowManager;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureWakeFeatures();
    }

    private void configureWakeFeatures() {
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }
    }


    @Override
    public void onDestroy() {
        super.onDestroy(); 
    }
}
