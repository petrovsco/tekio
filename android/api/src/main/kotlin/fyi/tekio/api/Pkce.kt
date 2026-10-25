package fyi.tekio.api

import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64

/** The PKCE pair a sign-in link is asked for with (RFC 7636, S256): the app
 *  keeps the verifier and sends only its hash, so the code the link comes back
 *  with is worth nothing to anyone without the verifier. */
object Pkce {
    private val b64 = Base64.getUrlEncoder().withoutPadding()

    /** 64 base64url characters from 48 random bytes. */
    fun verifier(random: SecureRandom = SecureRandom()): String =
        b64.encodeToString(ByteArray(48).also(random::nextBytes))

    fun challenge(verifier: String): String =
        b64.encodeToString(MessageDigest.getInstance("SHA-256").digest(verifier.toByteArray(Charsets.US_ASCII)))
}
