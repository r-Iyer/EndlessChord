package com.rohitiyer.endlesschord;

import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.content.pm.ActivityInfo;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    @Override
    public void onResume() {
        super.onResume();
        setupWebView();
    }

    private void setupWebView() {
        WebView webView = getBridge().getWebView();
        
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View view, WebChromeClient.CustomViewCallback callback) {
                // Hide original WebView
                getBridge().getWebView().setVisibility(View.GONE);
                
                // Add custom view
                customView = view;
                customViewCallback = callback;
                ViewGroup decorView = (ViewGroup) getWindow().getDecorView();
                decorView.addView(customView);
                
                // Lock to landscape
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
            }

            @Override
            public void onHideCustomView() {
                // 1. Remove custom view
                if (customView != null) {
                    ViewGroup decorView = (ViewGroup) getWindow().getDecorView();
                    decorView.removeView(customView);
                    customView = null;
                }
                
                // 2. Restore WebView
                getBridge().getWebView().setVisibility(View.VISIBLE);
                
                // 3. Callback cleanup
                if (customViewCallback != null) {
                    customViewCallback.onCustomViewHidden();
                    customViewCallback = null;
                }
                
                // 4. Reset orientation
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
            }
        });
    }
}