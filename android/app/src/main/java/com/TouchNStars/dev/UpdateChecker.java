package com.TouchNStars.dev;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.ProgressDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Environment;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.IOException;
import java.lang.ref.WeakReference;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okio.Buffer;
import okio.BufferedSink;
import okio.BufferedSource;
import okio.Okio;

public class UpdateChecker {
    private final WeakReference<Activity> contextRef;
    private static final String GITHUB_RELEASES_URL = "https://api.github.com/repos/Touch-N-Stars/Touch-N-Stars/releases/latest";
    private static final String APK_DOWNLOAD_URL_TEMPLATE = "https://github.com/Touch-N-Stars/Touch-N-Stars/releases/download/v%s/TouchNStars-%s.apk";
    public static final int INSTALL_REQUEST_CODE = 1001;
    public static final int REQUEST_INSTALL_PERMISSION = 1002;
    private DownloadApkTask currentDownloadTask;

    public UpdateChecker(Activity context) {
        this.contextRef = new WeakReference<>(context);
    }

    public void checkForUpdate(String currentVersion) {
        Activity activity = contextRef.get();
        if (activity != null) {
            new CheckUpdateTask(activity, currentVersion).execute();
        }
    }

    public void cancelPendingDownloads() {
        if (currentDownloadTask != null) {
            currentDownloadTask.cancel(true);
        }
    }

    private static class CheckUpdateTask extends AsyncTask<Void, Void, String> {
        private final WeakReference<Activity> activityRef;
        private final String currentVersion;
        private final OkHttpClient client = new OkHttpClient();

        CheckUpdateTask(Activity context, String currentVersion) {
            this.activityRef = new WeakReference<>(context);
            this.currentVersion = currentVersion;
        }

        @Override
        protected String doInBackground(Void... voids) {
            try {
                Request pingRequest = new Request.Builder()
                        .url("https://github.com")
                        .head()
                        .build();

                if (!client.newCall(pingRequest).execute().isSuccessful()) return null;

                Response response = client.newCall(
                        new Request.Builder().url(GITHUB_RELEASES_URL).build()
                ).execute();

                String json = response.body().string();
                String latestVersion = json.split("\"tag_name\":\"v")[1].split("\"")[0];
                return latestVersion.compareTo(currentVersion) > 0 ? latestVersion : null;
            } catch (IOException e) {
                return null;
            }
        }

        @Override
        protected void onPostExecute(String latestVersion) {
            Activity activity = activityRef.get();
            if (activity != null && latestVersion != null) {
                showUpdateDialog(activity, latestVersion);
            }
        }

        private void showUpdateDialog(Activity activity, String newVersion) {
            new AlertDialog.Builder(activity)
                    .setTitle("Update Available")
                    .setMessage("Version " + newVersion + " is ready to download")
                    .setPositiveButton("Install", (d, w) -> startDownload(activity, newVersion))
                    .setNegativeButton("Cancel", null)
                    .show();
        }

        private void startDownload(Activity activity, String version) {
            UpdateChecker updater = new UpdateChecker(activity);
            updater.currentDownloadTask = updater.new DownloadApkTask(version);
            updater.currentDownloadTask.execute();
        }
    }

    private class DownloadApkTask extends AsyncTask<Void, Integer, File> {
        private final String version;
        private final OkHttpClient client = new OkHttpClient();
        private WeakReference<ProgressDialog> progressDialogRef;
        private long contentLength = -1;

        DownloadApkTask(String version) {
            this.version = version;
        }

        @Override
        protected void onPreExecute() {
            Activity activity = contextRef.get();
            if (activity == null) return;

            ProgressDialog progressDialog = new ProgressDialog(activity);
            progressDialog.setTitle("Downloading Update");
            progressDialog.setMessage("Starting download...");
            progressDialog.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);
            progressDialog.setIndeterminate(true);
            progressDialog.setCancelable(false);
            progressDialog.setButton(DialogInterface.BUTTON_NEGATIVE, "Cancel",
                    (dialog, which) -> cancel(true));
            progressDialog.show();
            progressDialogRef = new WeakReference<>(progressDialog);
        }

        @Override
        protected File doInBackground(Void... voids) {
            Activity activity = contextRef.get();
            if (activity == null || isCancelled()) return null;

            try {
                Response response = client.newCall(
                        new Request.Builder()
                                .url(String.format(APK_DOWNLOAD_URL_TEMPLATE, version, version))
                                .build()
                ).execute();

                contentLength = response.body().contentLength();
                File apkFile = new File(
                        activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),
                        "TouchNStars-" + version + ".apk"
                );

                try (BufferedSource source = response.body().source();
                     BufferedSink sink = Okio.buffer(Okio.sink(apkFile))) {

                    Buffer buffer = new Buffer();
                    long totalRead = 0;

                    while (!isCancelled()) {
                        long bytesRead = source.read(buffer, 8192);
                        if (bytesRead == -1) break;

                        sink.write(buffer, bytesRead);
                        totalRead += bytesRead;
                        buffer.clear();

                        if (contentLength > 0) {
                            int progress = (int) ((totalRead * 100) / contentLength);
                            publishProgress(progress);
                        } else {
                            publishProgress(-1);
                        }
                    }
                }
                return isCancelled() ? null : apkFile;
            } catch (IOException e) {
                return null;
            }
        }

        @Override
        protected void onProgressUpdate(Integer... values) {
            ProgressDialog dialog = progressDialogRef.get();
            if (dialog == null) return;

            int progress = values[0];
            if (progress == -1) {
                dialog.setIndeterminate(true);
                dialog.setMessage("Downloading...");
            } else {
                dialog.setIndeterminate(false);
                dialog.setMax(100);
                dialog.setProgress(progress);
                dialog.setMessage("Downloaded " + progress + "%");
            }
        }

        @Override
        protected void onPostExecute(File apkFile) {
            dismissDialog();
            handleInstallation(apkFile);
        }

        @Override
        protected void onCancelled() {
            dismissDialog();
            cleanupPartialDownload();
        }

        private void dismissDialog() {
            ProgressDialog dialog = progressDialogRef.get();
            if (dialog != null && dialog.isShowing()) {
                dialog.dismiss();
            }
        }

        private void handleInstallation(File apkFile) {
            Activity activity = contextRef.get();
            if (activity == null || apkFile == null) return;

            Uri apkUri = FileProvider.getUriForFile(activity,
                    "com.TouchNStars.dev.provider",
                    apkFile);

            Intent installIntent = new Intent(Intent.ACTION_VIEW)
                    .setDataAndType(apkUri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            if (activity.getPackageManager().canRequestPackageInstalls()) {
                activity.startActivityForResult(installIntent, INSTALL_REQUEST_CODE);
            } else {
                activity.startActivityForResult(
                        new Intent(android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES)
                                .setData(Uri.parse("package:" + activity.getPackageName())),
                        REQUEST_INSTALL_PERMISSION
                );
            }
        }

        private void cleanupPartialDownload() {
            Activity activity = contextRef.get();
            if (activity != null) {
                File apkFile = new File(
                        activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),
                        "TouchNStars-" + version + ".apk"
                );
                if (apkFile.exists()) {
                    apkFile.delete();
                }
            }
        }
    }
}
