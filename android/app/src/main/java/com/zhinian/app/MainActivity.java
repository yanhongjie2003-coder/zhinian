package com.zhinian.app;

import android.app.Activity;
import android.graphics.Insets;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowInsets;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

/**
 * 止念 · 极简 WebView 壳。
 * 通过 WebViewAssetLoader 以 https://appassets.androidplatform.net 提供本地资源,
 * 保证 localStorage / DOM Storage 在 WebView 中稳定可用;应用完全离线,无网络权限。
 * 网页本体在构建时由 CI 从仓库根目录同步进 assets/(见 .github/workflows/android-build.yml)。
 *
 * 全面屏适配:targetSdk 35 在 Android 15 上强制 edge-to-edge,内容会顶进状态栏/手势条。
 * 这里把两栏高度注入网页为 CSS 变量 --sat / --sab(css/02-base.css 等处消费),
 * 网页自己给自己留白——主题色由页面绘制,浅色深色都不会露出异色边条。
 */
public class MainActivity extends Activity {

    private WebView webView;
    private int lastTop = -1, lastBottom = -1;   // 最近一次注入的留白(-1 = 尚未收到)

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        final WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                // 页面刚载入时可能还没收到 insets 事件,把已知的留白补注入一次
                applyInsets(lastTop, lastBottom);
            }
        });

        // 系统栏高度 → CSS 变量。Android 11-(API 30 以下)内容本就不顶进系统栏,无需处理。
        webView.setOnApplyWindowInsetsListener((v, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                Insets bars = insets.getInsets(WindowInsets.Type.statusBars()
                        | WindowInsets.Type.displayCutout());
                Insets nav = insets.getInsets(WindowInsets.Type.navigationBars());
                applyInsets(bars.top, nav.bottom);
                return WindowInsets.CONSUMED;
            }
            return insets;
        });

        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
    }

    /* 把状态栏(上)与手势条(下)高度写进网页的 CSS 变量;值没变就不重复注入 */
    private void applyInsets(int top, int bottom) {
        if (top == lastTop && bottom == lastBottom) return;
        lastTop = top;
        lastBottom = bottom;
        webView.post(() -> {
            if (webView == null) return;
            webView.evaluateJavascript(
                    "document.documentElement.style.setProperty('--sat','" + top + "px');" +
                    "document.documentElement.style.setProperty('--sab','" + bottom + "px');", null);
        });
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
