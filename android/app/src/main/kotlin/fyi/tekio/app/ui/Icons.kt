package fyi.tekio.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.unit.Dp

/** The web's line icons (src/components/ui/Icon.tsx): one path each on a
 *  24-unit square, stroked 1.8 with round ends. Only the ones a phone screen
 *  draws are here. */
enum class Glyph(val d: String) {
    Heart("M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10z"),
    Pause("M9 6v12M15 6v12"),
}

@Composable
fun Icon(glyph: Glyph, size: Dp, color: Color, modifier: Modifier = Modifier) {
    val path = remember(glyph) { PathParser().parsePathString(glyph.d).toPath() }
    Canvas(modifier.size(size)) {
        val k = this.size.width / 24f
        scale(k, k, pivot = Offset.Zero) {
            drawPath(path, color, style = Stroke(width = 1.8f, cap = StrokeCap.Round, join = StrokeJoin.Round))
        }
    }
}
