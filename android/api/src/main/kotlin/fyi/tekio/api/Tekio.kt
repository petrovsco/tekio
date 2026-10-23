package fyi.tekio.api

import fyi.tekio.client.apis.DefaultApi
import fyi.tekio.client.infrastructure.ApiClient
import fyi.tekio.client.infrastructure.ClientError
import fyi.tekio.client.infrastructure.ClientException
import fyi.tekio.client.infrastructure.Serializer
import fyi.tekio.client.models.ExchangeSignInCodeRequest
import fyi.tekio.client.models.HomeView
import fyi.tekio.client.models.RefreshSessionRequest
import fyi.tekio.client.models.SendSignInLinkRequest
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.OkHttpClient
import fyi.tekio.client.models.Session as SessionBody

/** The session has ended, or never began: the app shows the sign-in screen. */
class SignedOut : Exception("Sign in again.")

/** The API refused a call for what it held, and said why in its own words. */
class Refused(val reason: String, val status: Int) : Exception(reason)

/**
 * The app's one door to the API (RFC 0096). Every read the app draws comes
 * from here, as the API computed it: nothing is worked out on the phone.
 * Calls block; the app makes them off the main thread.
 *
 * @param baseUrl the API's address, such as `https://stg-app.tekio.fyi/`.
 * @param redirectTo where a sign-in link comes back to: the app's own address.
 */
class Tekio(
    baseUrl: String,
    private val store: SessionStore,
    private val redirectTo: String = SIGN_IN_ADDRESS,
    client: OkHttpClient = ApiClient.defaultClient,
    private val clock: () -> Long = { System.currentTimeMillis() / 1000 },
) {
    private val api = DefaultApi(baseUrl.trimEnd('/'), client)

    val signedIn: Boolean get() = store.session != null
    val email: String? get() = store.session?.email

    /** Emails a sign-in link. The account is made the first time an address asks. */
    fun sendSignInLink(email: String) {
        val verifier = Pkce.verifier()
        store.pendingVerifier = verifier
        call { api.sendSignInLink(SendSignInLinkRequest(email.trim(), java.net.URI(redirectTo), Pkce.challenge(verifier))) }
    }

    /** Finishes signing in with the code the link came back with. */
    fun finishSignIn(code: String) {
        val verifier = store.pendingVerifier ?: throw Refused("This link was asked for elsewhere. Ask for a new one here.", 400)
        val s = call { api.exchangeSignInCode(ExchangeSignInCodeRequest(code, verifier)) }
        store.pendingVerifier = null
        store.session = s.toSession()
    }

    /** Ends the session on this phone only. */
    fun signOut() {
        store.session = null
        ApiClient.accessToken = null
    }

    /** Everything Home prints, for the person's own day and last night. */
    fun homeView(date: String = Days.today(), lastNight: String = Days.lastNight()): HomeView =
        authed { api.getHomeView(date, lastNight) }

    /**
     * Runs a call as the signed-in person: a token close to running out is
     * refreshed first, and a token the API refuses is refreshed once and the
     * call tried again. A refresh the server refuses ends the session.
     */
    fun <T> authed(block: (DefaultApi) -> T): T {
        val current = store.session ?: throw SignedOut()
        val session = if (current.expiresAt - clock() < 60) refresh(current) else current
        ApiClient.accessToken = session.accessToken
        return try {
            call { block(api) }
        } catch (e: Refused) {
            if (e.status != 401) throw e
            ApiClient.accessToken = refresh(session).accessToken
            try {
                call { block(api) }
            } catch (again: Refused) {
                if (again.status == 401) signOut().also { throw SignedOut() }
                throw again
            }
        }
    }

    private fun refresh(session: Session): Session {
        val fresh = try {
            call { api.refreshSession(RefreshSessionRequest(session.refreshToken)) }
        } catch (e: Refused) {
            signOut()
            throw SignedOut()
        }
        return fresh.toSession().copy(email = fresh.email ?: session.email).also { store.session = it }
    }

    /** A refusal as the API's own words; anything else (no network) as it is. */
    private fun <T> call(block: () -> T): T = try {
        block()
    } catch (e: ClientException) {
        throw Refused(reason(e), e.statusCode)
    }

    private fun reason(e: ClientException): String {
        val body = (e.response as? ClientError<*>)?.body as? String
        return body?.let {
            runCatching { Serializer.kotlinxSerializationJson.parseToJsonElement(it).jsonObject["error"]?.jsonPrimitive?.content }.getOrNull()
        } ?: "Something went wrong."
    }

    companion object {
        /** The app's own address a sign-in link comes back to. It is on the
         *  Supabase project's redirect allow list. */
        const val SIGN_IN_ADDRESS = "fyi.tekio.app://sign-in"
    }
}

private fun SessionBody.toSession() = Session(accessToken, refreshToken, expiresAt.toLong(), email)
