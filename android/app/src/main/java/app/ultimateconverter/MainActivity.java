package app.ultimateconverter;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

public class MainActivity extends BridgeActivity {

    private boolean immersiveModeEnabled = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupEdgeToEdge();
        registerPlugin(FullscreenPlugin.class);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && immersiveModeEnabled) {
            hideSystemUI();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (immersiveModeEnabled) {
            hideSystemUI();
        }
    }

    private void setupEdgeToEdge() {
        Window window = getWindow();

        // Enable edge-to-edge display
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // Make system bars transparent
        window.setStatusBarColor(android.graphics.Color.TRANSPARENT);
        window.setNavigationBarColor(android.graphics.Color.TRANSPARENT);

        hideSystemUI();
    }

    private void hideSystemUI() {
        Window window = getWindow();
        View decorView = window.getDecorView();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+ (API 30+)
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                // Hide ONLY navigation bar, keep status bar visible
                controller.hide(WindowInsets.Type.navigationBars());

                // Set immersive sticky behavior - navigation bar reappears on swipe and auto-hides
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
        } else {
            // Android 10 and below (API 29 and below)
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
            if (controller != null) {
                // Hide ONLY navigation bar, keep status bar visible
                controller.hide(WindowInsetsCompat.Type.navigationBars());
                controller.setSystemBarsBehavior(
                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }

            // Fallback for older devices - hide only navigation, keep status bar
            decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            );
        }
    }

    public void showSystemUI() {
        Window window = getWindow();
        View decorView = window.getDecorView();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+ (API 30+)
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                // Show navigation bar
                controller.show(WindowInsets.Type.navigationBars());
            }
        } else {
            // Android 10 and below (API 29 and below)
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
            if (controller != null) {
                // Show navigation bar
                controller.show(WindowInsetsCompat.Type.navigationBars());
            }

            // Fallback for older devices - show navigation bar
            decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            );
        }
    }

    public void setImmersiveMode(boolean enabled) {
        immersiveModeEnabled = enabled;
        if (enabled) {
            hideSystemUI();
        } else {
            showSystemUI();
        }
    }

    // Capacitor Plugin for controlling fullscreen mode
    @CapacitorPlugin(name = "Fullscreen")
    public static class FullscreenPlugin extends Plugin {
        @PluginMethod
        public void disableImmersiveMode(PluginCall call) {
            MainActivity activity = (MainActivity) getActivity();
            activity.runOnUiThread(() -> {
                activity.setImmersiveMode(false);
                call.resolve();
            });
        }

        @PluginMethod
        public void enableImmersiveMode(PluginCall call) {
            MainActivity activity = (MainActivity) getActivity();
            activity.runOnUiThread(() -> {
                activity.setImmersiveMode(true);
                call.resolve();
            });
        }
    }
}
