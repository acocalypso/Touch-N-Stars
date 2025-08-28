package com.TouchNStars.dev;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.IOException;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(name = "MediaStoreImageSaver")
public class MediaStoreImageSaver extends Plugin {
    
    private static final String TAG = "MediaStoreImageSaver";

    @PluginMethod
    public void saveImageToGallery(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String filename = call.getString("filename");
        String folderName = call.getString("folderName", "TouchNStars");
        
        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("Base64 data is required");
            return;
        }
        
        if (filename == null || filename.isEmpty()) {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault());
            filename = "TNS_" + sdf.format(new Date()) + ".png";
        }
        
        try {
            // Remove data URL prefix if present
            if (base64Data.startsWith("data:")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }
            
            byte[] imageBytes = Base64.decode(base64Data, Base64.DEFAULT);
            
            String savedPath = saveImageToMediaStore(imageBytes, filename, folderName);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("path", savedPath);
            result.put("filename", filename);
            result.put("message", "Image saved to gallery successfully");
            
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error saving image to gallery", e);
            call.reject("Failed to save image: " + e.getMessage());
        }
    }
    
    private String saveImageToMediaStore(byte[] imageBytes, String filename, String folderName) throws IOException {
        Context context = getContext();
        ContentResolver resolver = context.getContentResolver();
        
        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, filename);
        values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // For Android 10+ use MediaStore with relative path
            values.put(MediaStore.Images.Media.RELATIVE_PATH, 
                      Environment.DIRECTORY_PICTURES + "/" + folderName);
            values.put(MediaStore.Images.Media.IS_PENDING, 1);
        } else {
            // For older Android versions
            String picturesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES).toString();
            values.put(MediaStore.Images.Media.DATA, picturesDir + "/" + folderName + "/" + filename);
        }
        
        Uri imageUri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
        
        if (imageUri == null) {
            throw new IOException("Failed to create MediaStore entry");
        }
        
        try (OutputStream outputStream = resolver.openOutputStream(imageUri)) {
            if (outputStream == null) {
                throw new IOException("Failed to open output stream");
            }
            
            outputStream.write(imageBytes);
            outputStream.flush();
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Mark as not pending
            values.clear();
            values.put(MediaStore.Images.Media.IS_PENDING, 0);
            resolver.update(imageUri, values, null, null);
        }
        
        Log.i(TAG, "Image saved successfully to MediaStore: " + imageUri.toString());
        
        return imageUri.toString();
    }
}