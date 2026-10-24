package fyi.tekio.api

import fyi.tekio.client.infrastructure.Serializer
import fyi.tekio.client.models.GateColumn
import fyi.tekio.client.models.HomeView
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import mockwebserver3.MockResponse
import mockwebserver3.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.time.LocalDateTime

// The app's door to the API, against a fake server. Every token, address and
// reading is invented; home-view.json was written by @tekio/core's homeView
// from invented rows.
class TekioTest {
    private lateinit var server: MockWebServer
    private val homeJson = javaClass.getResource("/home-view.json")!!.readText()

    @Before fun start() { server = MockWebServer().apply { start() } }
    @After fun stop() { server.close() }

    private fun json(body: String, code: Int = 200) =
        MockResponse.Builder().code(code).addHeader("Content-Type", "application/json").body(body).build()

    private fun session(token: String, expiresAt: Long = 4_000_000_000) =
        """{"accessToken":"$token","refreshToken":"r-$token","expiresAt":$expiresAt,"email":"someone@example.com"}"""

    private fun tekio(store: SessionStore, now: Long = 1_800_000_000) = Tekio(server.url("/").toString(), store, clock = { now })

    @Test fun `a link is asked for with the hash, and the code is exchanged with the verifier kept`() {
        val store = MemorySessionStore()
        server.enqueue(MockResponse.Builder().code(204).build())
        server.enqueue(json(session("a1")))
        val tekio = tekio(store)

        tekio.sendSignInLink(" someone@example.com ")
        val link = Json.parseToJsonElement(server.takeRequest().body!!.utf8()).jsonObject
        assertEquals("someone@example.com", link["email"]!!.jsonPrimitive.content)
        assertEquals(Tekio.SIGN_IN_ADDRESS, link["redirectTo"]!!.jsonPrimitive.content)
        val verifier = store.pendingVerifier!!
        assertEquals(Pkce.challenge(verifier), link["codeChallenge"]!!.jsonPrimitive.content)

        tekio.finishSignIn("code-1")
        val exchange = server.takeRequest()
        assertEquals("/api/sign-in/session", exchange.url.encodedPath)
        val body = Json.parseToJsonElement(exchange.body!!.utf8()).jsonObject
        assertEquals(verifier, body["codeVerifier"]!!.jsonPrimitive.content)
        assertTrue(tekio.signedIn)
        assertNull(store.pendingVerifier)
        assertEquals("someone@example.com", tekio.email)
    }

    @Test fun `Home is read with the bearer token, for the person's own day and night`() {
        val store = MemorySessionStore().apply { session = Session("a1", "r1", 4_000_000_000, null) }
        server.enqueue(json(homeJson))
        val view = tekio(store).homeView("2026-10-20", "2026-10-20")
        val req = server.takeRequest()
        assertEquals("Bearer a1", req.headers["Authorization"])
        assertEquals("2026-10-20", req.url.queryParameter("lastNight"))
        assertEquals("Push. Ant delt and biceps are the gap.", view.verdict.text)
        assertEquals(GateColumn.Bar.GAUGE, view.readiness.columns[1].bar)
        assertEquals(listOf("1 · ANT DELT", "2 · BICEPS"), view.map.callouts.take(2).map { it.label })
    }

    @Test fun `a token about to run out is refreshed before the call`() {
        val store = MemorySessionStore().apply { session = Session("old", "r-old", 1_800_000_030, "someone@example.com") }
        server.enqueue(json(session("new")))
        server.enqueue(json(homeJson))
        tekio(store).homeView("2026-10-20", "2026-10-20")
        assertEquals("/api/sign-in/refresh", server.takeRequest().url.encodedPath)
        assertEquals("Bearer new", server.takeRequest().headers["Authorization"])
        assertEquals("new", store.session!!.accessToken)
    }

    @Test fun `a refused token is refreshed once, and a refused refresh signs out`() {
        val store = MemorySessionStore().apply { session = Session("a1", "r1", 4_000_000_000, null) }
        server.enqueue(json("""{"error":"Sign in again: no valid access token."}""", 401))
        server.enqueue(json("""{"error":"Invalid Refresh Token"}""", 400))
        val tekio = tekio(store)
        try {
            tekio.homeView("2026-10-20", "2026-10-20")
            throw AssertionError("expected SignedOut")
        } catch (_: SignedOut) {
        }
        assertFalse(tekio.signedIn)
    }

    @Test fun `a refusal carries the API's own reason`() {
        val tekio = tekio(MemorySessionStore())
        server.enqueue(json("""{"error":"Too many links in a row."}""", 400))
        try {
            tekio.sendSignInLink("someone@example.com")
            throw AssertionError("expected Refused")
        } catch (e: Refused) {
            assertEquals("Too many links in a row.", e.reason)
        }
    }
}

class SharedTest {
    @Test fun `the PKCE challenge is the base64url SHA-256 of the verifier`() {
        // RFC 7636 appendix B's own example pair.
        assertEquals("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM", Pkce.challenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"))
        assertEquals(64, Pkce.verifier().length)
    }

    @Test fun `last night turns over at four in the morning`() {
        assertEquals("2026-10-19", Days.lastNight(LocalDateTime.of(2026, 10, 20, 3, 59)))
        assertEquals("2026-10-20", Days.lastNight(LocalDateTime.of(2026, 10, 20, 4, 0)))
    }

    @Test fun `the body map is the core's, with a zone for every anchor`() {
        val map = BodyMap.load()
        val zoned = (map.front + map.back).map { it.muscle }.toSet()
        assertEquals(20, map.anchors.size)
        assertTrue(map.anchors.keys.all { it in zoned })
    }

    @Test fun `the home view decodes whole`() {
        val view = Serializer.kotlinxSerializationJson.decodeFromString(HomeView.serializer(), javaClass.getResource("/home-view.json")!!.readText())
        assertEquals(3, view.wholeBody.size)
        assertEquals(listOf("weight", "blood"), view.folds.map { it.kind.value })
    }
}
