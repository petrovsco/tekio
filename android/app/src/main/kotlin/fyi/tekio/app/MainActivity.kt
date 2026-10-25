package fyi.tekio.app

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import fyi.tekio.api.Tekio
import fyi.tekio.app.ui.App

class MainActivity : ComponentActivity() {
    private val model: AppModel by viewModels {
        object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T =
                AppModel((application as TekioApplication).tekio) as T
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Paper in light and dark alike (SIGNAL has no dark theme yet), so the
        // bars keep dark icons whatever the system theme.
        val bars = SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT)
        enableEdgeToEdge(statusBarStyle = bars, navigationBarStyle = bars)
        if (savedInstanceState == null) handle(intent)
        setContent { App(model) }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handle(intent)
    }

    override fun onResume() {
        super.onResume()
        // Home is read again whenever the app comes back: the day may have
        // turned, or something was logged on the web meanwhile.
        model.loadHome()
    }

    /** A sign-in link coming back: fyi.tekio.app://sign-in?code=…, or the
     *  reason Auth refused it. */
    private fun handle(intent: Intent?) {
        val uri = intent?.data ?: return
        if (!uri.toString().startsWith(Tekio.SIGN_IN_ADDRESS)) return
        val code = uri.getQueryParameter("code")
        val refused = uri.getQueryParameter("error_description")
            ?: uri.fragment?.split("&")?.firstOrNull { it.startsWith("error_description=") }
                ?.substringAfter("=")?.let { java.net.URLDecoder.decode(it, "UTF-8") }
        when {
            code != null -> model.finishSignIn(code)
            refused != null -> model.linkRefused(refused)
        }
    }
}
