package com.TouchNStars.dev;

import android.os.Bundle;
import android.content.pm.PackageManager;
import android.content.Intent;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import android.view.WindowManager;

public class MainActivity extends BridgeActivity {
   // private UpdateChecker updateChecker;
    //private String currentVersion;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure screen wake settings
        configureWakeFeatures();

        // Initialize update checker
      //  initializeUpdateChecker();
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

   /* private void initializeUpdateChecker() {
        try {
            currentVersion = getPackageManager()
                    .getPackageInfo(getPackageName(), 0)
                    .versionName;

            updateChecker = new UpdateChecker(this);
            updateChecker.checkForUpdate(currentVersion);
        } catch (PackageManager.NameNotFoundException e) {
            Log.e("MainActivity", "Version info error", e);
        }
    }
*/
  /*  @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        switch (requestCode) {
            case UpdateChecker.INSTALL_REQUEST_CODE:
                handleInstallResult(resultCode);
                break;

            case UpdateChecker.REQUEST_INSTALL_PERMISSION:
                handlePermissionResult(resultCode);
                break;
        }
    }*/

   /* private void handleInstallResult(int resultCode) {
        switch (resultCode) {
            case RESULT_OK:
                Log.i("MainActivity", "Update installed successfully");
                break;
            case RESULT_CANCELED:
                Log.w("MainActivity", "Update installation canceled");
                break;
            default:
                Log.e("MainActivity", "Installation failed with code: " + resultCode);
        }
    }
*/
    /*private void handlePermissionResult(int resultCode) {
        if (resultCode == RESULT_OK && updateChecker != null) {
            // Retry installation after permission granted
            updateChecker.checkForUpdate(currentVersion);
        } else {
            Log.w("MainActivity", "Install permission denied");
        }
    }*/

    @Override
    public void onDestroy() {
        super.onDestroy(); // <-- Critical for proper lifecycle

    /*    if (updateChecker != null) {
            updateChecker.cancelPendingDownloads();
        }*/
    }
}
