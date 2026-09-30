package com.hollowfoundation.app;

import android.content.Context;
import android.content.res.Configuration;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void attachBaseContext(Context newBase) {
        super.attachBaseContext(newBase);
        // Pin the font scale: users with enlarged system fonts (accessibility
        // settings) otherwise inflate every rem inside the WebView, which
        // breaks the layout and hides the mobile UI behind desktop breakpoints.
        Configuration config = newBase.getResources().getConfiguration();
        if (config.fontScale != 1.0f) {
            config.fontScale = 1.0f;
            newBase.getResources().updateConfiguration(config, newBase.getResources().getDisplayMetrics());
        }
    }
}
