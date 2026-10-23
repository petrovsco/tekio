package fyi.tekio.api

/** A signed-in session: the bearer token every route takes, and the one-use
 *  token that gets the next one. */
data class Session(
    val accessToken: String,
    val refreshToken: String,
    /** When the access token runs out, in seconds since 1970. */
    val expiresAt: Long,
    val email: String?,
)

/** Where the app keeps the session and, while a link is on its way, the PKCE
 *  verifier it was asked for with. On the phone this is the app's private
 *  storage; in a test, memory. */
interface SessionStore {
    var session: Session?
    var pendingVerifier: String?
}

class MemorySessionStore : SessionStore {
    override var session: Session? = null
    override var pendingVerifier: String? = null
}
