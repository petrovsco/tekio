package fyi.tekio.app.ui

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

// The SIGNAL language (tekio.rfcs/design-system.md), as the phone draws it.
// One CSS pixel on the web is one dp here, so every size reads as the web's.

object Ink {
    /** Primary · secondary · labels · asides (§3). That is the whole set. */
    val primary = Color(0xFF1A1A1A)
    val secondary = Color(0xFF6B6B6B)
    val label = Color(0xFF8A8A8A)
    val aside = Color(0xFFA8A8A8)

    /** The one accent: action lives here (§1). */
    val accent = Color(0xFFC2410C)

    /** Ground and surfaces (§2). */
    val paper = Color(0xFFFAF9F7)
    val card = Color(0xFFFFFFFF)
    val edge = Color(0xFFE2E2E0)
    val hairline = Color(0xFFEEEEEC)
    val chrome = Color(0xFFD6D6D4)
    val invertLine = Color(0xFF4A4A4A)

    /** The stimulus ramp, under 10 % to the top band (§4). */
    val ramp = listOf(Color(0xFFECECEA), Color(0xFFC9C9C7), Color(0xFF8F8F8F), Color(0xFF1F1F1F))
    val noData = Color(0xFFEEEEEC)
    val outline = Color(0xFFC9C9C7)
}

/** Two faces (§5): the sans for everything, the serif for the verdict only. */
object Type {
    val wordmark = TextStyle(fontSize = 15.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.14.em, color = Ink.primary)
    val verdict = TextStyle(
        fontFamily = FontFamily.Serif, fontSize = 28.sp, lineHeight = 31.36.sp, fontWeight = FontWeight.Bold,
        letterSpacing = (-0.01).em, color = Ink.accent,
    )
    val body = TextStyle(fontSize = 12.sp, lineHeight = 16.8.sp, color = Ink.primary)
    val sub = body.copy(color = Ink.secondary)
    val meta = TextStyle(fontSize = 11.sp, color = Ink.secondary)

    /** Section labels: 9–10 px, bold, uppercase, tracked, in the label ink. */
    fun label(size: Int = 9, tracking: Double = 0.14) =
        TextStyle(fontSize = size.sp, fontWeight = FontWeight.Bold, letterSpacing = tracking.em, color = Ink.label)

    val note = TextStyle(fontSize = 9.sp, color = Ink.aside)
}
