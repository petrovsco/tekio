package fyi.tekio.app

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import fyi.tekio.api.Refused
import fyi.tekio.api.SignedOut
import fyi.tekio.api.Tekio
import fyi.tekio.client.models.HomeView
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.IOException

/** What the app shows: the sign-in screen, or Home and the read behind it. */
class AppModel(private val tekio: Tekio) : ViewModel() {
    var signedIn by mutableStateOf(tekio.signedIn)
        private set

    /** The address signed in with, when Auth said it. */
    val email: String? get() = tekio.email

    /** The sign-in screen's state. */
    var linkSentTo by mutableStateOf<String?>(null)
        private set
    var signInError by mutableStateOf<String?>(null)
        private set
    var busy by mutableStateOf(false)
        private set

    /** Home: the last view read, and why the latest read failed, if it did. */
    var home by mutableStateOf<HomeView?>(null)
        private set
    var homeError by mutableStateOf<String?>(null)
        private set
    var refreshing by mutableStateOf(false)
        private set

    fun sendLink(email: String) = work(io = { tekio.sendSignInLink(email) }) {
        linkSentTo = email.trim()
    }

    fun startOver() {
        linkSentTo = null
        signInError = null
    }

    /** The link came back to the app with its code. */
    fun finishSignIn(code: String) = work(io = { tekio.finishSignIn(code) }) {
        signedIn = true
        linkSentTo = null
        loadHome()
    }

    /** A link that came back refused (expired, already used): say why. */
    fun linkRefused(reason: String) {
        signInError = reason
    }

    fun loadHome() {
        if (!signedIn || refreshing) return
        refreshing = true
        viewModelScope.launch {
            try {
                home = withContext(Dispatchers.IO) { tekio.homeView() }
                homeError = null
            } catch (e: SignedOut) {
                signOut()
            } catch (e: Refused) {
                homeError = e.reason
            } catch (e: IOException) {
                homeError = "No connection. Pull down to try again."
            } finally {
                refreshing = false
            }
        }
    }

    fun signOut() {
        tekio.signOut()
        signedIn = false
        home = null
    }

    /** A sign-in call off the main thread, then `after` back on it; a refusal
     *  shows on the sign-in screen in the API's own words. */
    private fun work(io: () -> Unit, after: () -> Unit) {
        if (busy) return
        busy = true
        signInError = null
        viewModelScope.launch {
            try {
                withContext(Dispatchers.IO) { io() }
                after()
            } catch (e: Refused) {
                signInError = e.reason
            } catch (e: IOException) {
                signInError = "No connection. Try again when you're online."
            } finally {
                busy = false
            }
        }
    }
}
