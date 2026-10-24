package fyi.tekio.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Matrix
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.text.TextMeasurer
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.sp
import fyi.tekio.api.BodyMap
import fyi.tekio.client.models.MapCallout
import fyi.tekio.client.models.ZoneFill
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

// The "what is missing" map, as the web's GapMap draws it: the figure from
// @tekio/core's bodyMap.json recoloured by the stimulus ramp, a white 45° hatch
// for muscles still recovering, and the ranked callouts the API names drawn
// onto it — the callouts ARE the missing list, worst first. Each zone's step
// and hatch arrive in the view: the phone draws, it does not decide.

private class Shapes(map: BodyMap) {
    private fun parse(d: String): Path = PathParser().parsePathString(d).toPath()
    private val mirror = Matrix().apply {
        values[Matrix.ScaleX] = map.mirror.scaleX.toFloat()
        values[Matrix.TranslateX] = map.mirror.translateX.toFloat()
    }
    private fun mirrored(p: Path) = Path().apply { addPath(p); transform(mirror) }

    val half = parse(map.half)
    val halfMirrored = mirrored(half)
    val silhouette = Path().apply { addPath(half); addPath(halfMirrored) }
    val abs = parse(map.absLines)

    /** Each zone's shape, both sides joined where it is mirrored. */
    val front = map.front.map { it to zonePath(it) }
    val back = map.back.map { it to zonePath(it) }
    private fun zonePath(z: BodyMap.Zone): Path {
        val p = parse(z.d)
        return if (z.mirrored) Path().apply { addPath(p); addPath(mirrored(p)) } else p
    }
}

@Composable
fun BodyMapView(zones: List<ZoneFill>, callouts: List<MapCallout>, zeroData: Boolean, modifier: Modifier = Modifier) {
    val map = remember { BodyMap.load() }
    val shapes = remember(map) { Shapes(map) }
    val measurer = rememberTextMeasurer()
    val byMuscle = remember(zones) { zones.associateBy { it.muscle } }

    Canvas(modifier.fillMaxWidth().aspectRatio((map.viewBox[0] / map.viewBox[1]).toFloat())) {
        val s = size.width / map.viewBox[0].toFloat()
        // Map units → pixels for type: the map scales, so its text does too.
        fun units(u: Double): TextUnit = (u * s / density / fontScale).sp

        val placed = if (zeroData) emptyList() else place(map, callouts)
        // Shapes in the map's own units, scaled; type in pixels, at the
        // scaled place, so it is measured at the size it is drawn.
        withTransform({ scale(s, s, pivot = Offset.Zero) }) {
            figure(map, shapes, shapes.front, map.figures.front, byMuscle, abs = true)
            figure(map, shapes, shapes.back, map.figures.back, byMuscle, abs = false)
            leaders(placed)
        }
        val label = TextStyle(fontSize = units(7.0), color = Ink.label, letterSpacing = units(1.0))
        text(measurer, "FRONT", 117f * s, 8f * s, label, Anchor.MIDDLE)
        text(measurer, "BACK", 215f * s, 8f * s, label, Anchor.MIDDLE)
        for (p in placed) {
            val x = (if (p.left) 80f else 254f) * s
            val anchor = if (p.left) Anchor.END else Anchor.START
            val major = p.callout.rank != null
            text(
                measurer, p.callout.label, x, (p.labelY + 3f) * s,
                TextStyle(fontSize = units(9.0), color = if (major) Ink.accent else Ink.secondary, fontWeight = if (major) FontWeight.Bold else FontWeight.Normal),
                anchor,
            )
            text(measurer, p.callout.sub, x, (p.labelY + 13f) * s, TextStyle(fontSize = units(7.5), color = Ink.secondary), anchor)
        }
    }
}

private fun DrawScope.figure(
    map: BodyMap,
    shapes: Shapes,
    zones: List<Pair<BodyMap.Zone, Path>>,
    at: BodyMap.Offset,
    fills: Map<String, ZoneFill>,
    abs: Boolean,
) {
    val k = map.figures.scale.toFloat()
    withTransform({
        translate(at.x.toFloat(), at.y.toFloat())
        scale(k, k, pivot = Offset.Zero)
    }) {
        val head = map.head
        drawCircle(Ink.card, head.r.toFloat(), Offset(head.cx.toFloat(), head.cy.toFloat()))
        drawCircle(Ink.outline, head.r.toFloat(), Offset(head.cx.toFloat(), head.cy.toFloat()), style = Stroke(1f))
        for (half in listOf(shapes.half, shapes.halfMirrored)) {
            drawPath(half, Ink.card)
            drawPath(half, Ink.outline, style = Stroke(1f))
        }
        clipPath(shapes.silhouette) {
            for ((zone, path) in zones) {
                val fill = fills[zone.muscle]
                val step = fill?.step
                drawPath(path, if (step == null) Ink.noData else Ink.ramp[step])
                drawPath(path, Ink.card, style = Stroke(0.7f))
                if (fill?.recovering == true) hatch(path)
            }
            if (abs) drawPath(shapes.abs, Ink.card.copy(alpha = 0.5f), style = Stroke(0.5f))
        }
    }
}

/** The recovery hatch (§1): white 45° lines, 4 apart, 1.6 wide. */
private fun DrawScope.hatch(path: Path) {
    val b = path.getBounds()
    val step = 4f * sqrt(2f)
    clipPath(path) {
        var c = b.left + b.top - (b.left + b.top) % step - step
        while (c < b.right + b.bottom + step) {
            // The line x + y = c, across the zone's bounds.
            drawLine(Ink.card, Offset(c - b.top, b.top), Offset(c - b.bottom, b.bottom), strokeWidth = 1.6f)
            c += step
        }
    }
}

private class Placed(val callout: MapCallout, val dot: Offset, val left: Boolean, var labelY: Float = 0f)

/** Positions for the callouts: front muscles label to the left, back to the
 *  right; labels on one side are nudged apart and the leader follows. */
private fun place(map: BodyMap, callouts: List<MapCallout>): List<Placed> {
    val k = map.figures.scale
    val placed = callouts.mapNotNull { c ->
        val a = map.anchors[c.muscle] ?: return@mapNotNull null
        val f = if (a.fig == "front") map.figures.front else map.figures.back
        Placed(c, Offset((f.x + a.x * k).toFloat(), (f.y + a.y * k).toFloat()), a.fig == "front")
    }
    for (side in listOf(true, false)) {
        var prev = Float.NEGATIVE_INFINITY
        for (p in placed.filter { it.left == side }.sortedBy { it.dot.y }) {
            p.labelY = min(max(p.dot.y, max(prev + 24f, 16f)), 208f)
            prev = p.labelY
        }
    }
    return placed
}

/** Each callout's leader line and dot, in map units. */
private fun DrawScope.leaders(placed: List<Placed>) {
    for (p in placed) {
        drawLine(Ink.secondary, Offset(if (p.left) 83f else 251f, p.labelY), p.dot, strokeWidth = 1f)
        drawCircle(Ink.card, 2.3f, p.dot)
        drawCircle(Ink.accent, 2.3f, p.dot, style = Stroke(1.2f))
    }
}

private enum class Anchor { START, MIDDLE, END }

/** Text placed as SVG places it: `y` is the baseline, `x` its start, middle or end. */
private fun DrawScope.text(measurer: TextMeasurer, text: String, x: Float, y: Float, style: TextStyle, anchor: Anchor) {
    val layout = measurer.measure(text, style)
    val w = layout.size.width.toFloat()
    val left = when (anchor) {
        Anchor.START -> x
        Anchor.MIDDLE -> x - w / 2
        Anchor.END -> x - w
    }
    drawText(layout, topLeft = Offset(left, y - layout.firstBaseline))
}
