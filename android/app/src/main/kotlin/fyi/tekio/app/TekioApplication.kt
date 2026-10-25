package fyi.tekio.app

import android.app.Application
import android.content.Context
import android.content.SharedPreferences
import fyi.tekio.api.Session
import fyi.tekio.api.SessionStore
import fyi.tekio.api.Tekio

/** Holds the one door to the API for the whole app. */
class TekioApplication : Application() {
    lateinit var tekio: Tekio
        private set

    override fun onCreate() {
        super.onCreate()
        tekio = Tekio(BuildConfig.API_URL, PrefsSessionStore(getSharedPreferences("session", Context.MODE_PRIVATE)))
    }
}

/** The session in the app's private storage, which no other app can read. */
private class PrefsSessionStore(private val prefs: SharedPreferences) : SessionStore {
    override var session: Session?
        get() {
            val access = prefs.getString("access", null) ?: return null
            val refresh = prefs.getString("refresh", null) ?: return null
            return Session(access, refresh, prefs.getLong("expiresAt", 0), prefs.getString("email", null))
        }
        set(value) {
            prefs.edit().apply {
                if (value == null) {
                    remove("access"); remove("refresh"); remove("expiresAt"); remove("email")
                } else {
                    putString("access", value.accessToken)
                    putString("refresh", value.refreshToken)
                    putLong("expiresAt", value.expiresAt)
                    putString("email", value.email)
                }
            }.commit()
        }

    override var pendingVerifier: String?
        get() = prefs.getString("verifier", null)
        set(value) {
            prefs.edit().apply { if (value == null) remove("verifier") else putString("verifier", value) }.commit()
        }
}
