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
 * 全面屏适配(targetSdk 35 在 Android 15 上强制 edge-to-edge):
 * 网页用标准 env(safe-area-inset-*) 留白;页面就绪后探测一次,
 * 若这个 WebView 的 env 返回 0(个别版本不支持),才注入兜底变量。
 * 注意 insets 是物理像素,注入前要除以密度换算成 CSS 像素。
 */
public class MainActivity extends Activity {

    private WebView webView;
    private int lastTop = -1, lastBottom = -1;   // 最近一次收到的系统栏高度(物理像素,-1 = 尚未收到)

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
                // 页面就绪后探测 env() 是否有效;无效再用注入兜底
                webView.evaluateJavascript(ENV_PROBE, null);
                webView.evaluateJavascript(FALLBACK_INJECT, null);
            }
        });

        // 记录系统栏高度(物理像素),供 env 失效时的兜底注入使用
        webView.setOnApplyWindowInsetsListener((v, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                Insets bars = insets.getInsets(WindowInsets.Type.statusBars()
                        | WindowInsets.Type.displayCutout());
                Insets nav = insets.getInsets(WindowInsets.Type.navigationBars());
                lastTop = bars.top;
                lastBottom = nav.bottom;
            }
            return insets;
        });

        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");
    }

    /* 探测 env(safe-area-inset-*) 的实际值,存到 window 上 */
    private static final String ENV_PROBE =
            "(function(){var d=document.createElement('div');" +
            "d.style.cssText='position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;" +
            "padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';" +
            "document.body.appendChild(d);var c=getComputedStyle(d);" +
            "window.__envTop=parseFloat(c.paddingTop)||0;" +
            "window.__envBot=parseFloat(c.paddingBottom)||0;d.remove();})();";

    /* env 拿不到(为 0)时,用壳记录的物理像素 ÷ 密度 = CSS 像素 注入兜底 */
    private static final String FALLBACK_INJECT =
            "(function(){var t=window.__envTop||0,b=window.__envBot||0;" +
            "if(t>=1&&b>=1)return;" +
            "var dpr=window.devicePixelRatio||1;" +
            "var st=document.documentElement.style;" +
            "if(t<1)st.setProperty('--sat',Math.round((window.__fbTop||0)/dpr)+'px');" +
            "if(b<1)st.setProperty('--sab',Math.round((window.__fbBot||0)/dpr)+'px');})();";

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        // 系统栏高度此刻最可靠;存给兜底注入用(传给页面的是 CSS 像素,除以密度)
        if (Build.VERSION.SDK_INT >= 30 && webView != null) {
            WindowInsets insets = webView.getRootWindowInsets();
            if (insets != null) {
                Insets bars = insets.getInsets(WindowInsets.Type.statusBars()
                        | WindowInsets.Type.displayCutout());
                Insets nav = insets.getInsets(WindowInsets.Type.navigationBars());
                lastTop = bars.top;
                lastBottom = nav.bottom;
                float dpr = webView.getResources().getDisplayMetrics().density;
                webView.evaluateJavascript(
                        "window.__fbTop=" + Math.round(lastTop / dpr) + ";" +
                        "window.__fbBot=" + Math.round(lastBottom / dpr) + ";", null);
            }
        }
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
