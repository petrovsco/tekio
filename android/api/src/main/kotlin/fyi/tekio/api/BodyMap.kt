package fyi.tekio.api

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

/** The anatomical figure every muscle map is drawn on: @tekio/core's
 *  bodyMap.json, the same file the web draws from (RFC 0096). Paths are SVG
 *  path data in the figure's own 120×240 space. */
@Serializable
data class BodyMap(
    val viewBox: List<Double>,
    val half: String,
    val mirror: Mirror,
    val head: Head,
    val absLines: String,
    val front: List<Zone>,
    val back: List<Zone>,
    val figures: Figures,
    val anchors: Map<String, Anchor>,
) {
    @Serializable data class Mirror(val translateX: Double, val scaleX: Double)
    @Serializable data class Head(val cx: Double, val cy: Double, val r: Double)

    /** One muscle's shape, in paint order; `mirrored` draws it on both sides. */
    @Serializable data class Zone(val muscle: String, val parent: String, val mirrored: Boolean, val d: String)
    @Serializable data class Offset(val x: Double, val y: Double)
    @Serializable data class Figures(val front: Offset, val back: Offset, val scale: Double)

    /** Where a callout points, in the figure's own space. */
    @Serializable data class Anchor(val fig: String, val x: Double, val y: Double)

    companion object {
        private val json = Json { ignoreUnknownKeys = true }

        fun load(): BodyMap {
            val text = BodyMap::class.java.getResourceAsStream("/fyi/tekio/bodyMap.json")!!.bufferedReader().use { it.readText() }
            return json.decodeFromString(serializer(), text)
        }
    }
}
