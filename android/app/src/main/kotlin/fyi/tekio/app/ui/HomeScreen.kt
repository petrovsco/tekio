package fyi.tekio.app.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineBreak
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import fyi.tekio.app.AppModel
import fyi.tekio.client.models.FoldTile
import fyi.tekio.client.models.GateColumn
import fyi.tekio.client.models.GateColumnGauge
import fyi.tekio.client.models.HomeView
import fyi.tekio.client.models.QualityTile

// Home, as the web's HomeTab prints it: the whole five-second answer and
// nothing else. Every word and every state comes from GET /api/view/home; this
// file only lays them out in the SIGNAL language. The sheets behind each tap,
// and the door to Adaptations, come with the screens they open (RFC 0096).

/** Text that wraps like the web's `text-pretty`: no lone last word. */
private val pretty = TextStyle(lineBreak = LineBreak.Paragraph)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(model: AppModel) {
    val view = model.home
    PullToRefreshBox(
        isRefreshing = model.refreshing && view != null,
        onRefresh = model::loadHome,
        modifier = Modifier.fillMaxSize().background(Ink.paper),
    ) {
        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .safeDrawingPadding()
                .padding(horizontal = 16.dp, vertical = 12.dp),
        ) {
            Text("TEKIŌ", style = Type.wordmark, modifier = Modifier.padding(bottom = 8.dp))
            when {
                view != null -> {
                    model.homeError?.let { Text(it, style = Type.meta.copy(color = Ink.accent), modifier = Modifier.padding(bottom = 6.dp)) }
                    Home(view)
                    Footer(model)
                }
                model.homeError != null -> Unread(model.homeError!!, model)
                else -> Box(Modifier.fillMaxWidth().padding(top = 48.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(Modifier.size(20.dp), color = Ink.primary, strokeWidth = 2.dp)
                }
            }
        }
    }
}

/** No view yet and the read failed: say why, and offer the read again. */
@Composable
private fun Unread(reason: String, model: AppModel) {
    Column(Modifier.padding(top = 24.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(reason, style = Type.sub.merge(pretty))
        Btn("Try again", onClick = model::loadHome, working = model.refreshing)
    }
}

/** Signing out has no other home until the More screen arrives. */
@Composable
private fun Footer(model: AppModel) {
    Row(Modifier.fillMaxWidth().padding(top = 20.dp), verticalAlignment = Alignment.CenterVertically) {
        model.email?.let { Text(it, style = Type.meta.copy(color = Ink.label), modifier = Modifier.weight(1f)) }
            ?: Spacer(Modifier.weight(1f))
        Btn("Sign out", onClick = model::signOut, solid = false)
    }
}

@Composable
private fun Home(view: HomeView) {
    // The verdict: readiness gates the instruction; the sub names the gap.
    Row(Modifier.fillMaxWidth().padding(bottom = 6.dp), verticalAlignment = Alignment.CenterVertically) {
        Text("TODAY", style = Type.label(9, 0.16))
        Spacer(Modifier.weight(1f))
        Text(view.readinessLabel, style = Type.meta)
    }
    Text(view.verdict.text, style = Type.verdict.merge(pretty))
    Text(view.verdict.sub, style = Type.sub.merge(pretty), modifier = Modifier.padding(top = 6.dp))

    ReadinessCard(view, Modifier.padding(top = 12.dp))
    view.readiness.hint?.let {
        Text(it, style = TextStyle(fontSize = 10.sp, lineHeight = 13.5.sp, color = Ink.label).merge(pretty), modifier = Modifier.padding(top = 4.dp))
    }
    view.banner?.let { Banner(it) }
    Missing(view)
    WholeBody(view)
    Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        view.folds.forEach { Fold(it, Modifier.weight(1f)) }
    }
}

/** Bar tones on the readiness card; the held day's inversion remaps them. */
private fun tone(t: GateColumn.Tone, gated: Boolean): Color = when (t) {
    GateColumn.Tone.INK -> if (gated) Ink.card else Ink.primary
    GateColumn.Tone.MID -> if (gated) Ink.aside else Ink.ramp[2]
    GateColumn.Tone.ACCENT -> if (gated) Ink.card else Ink.accent
    GateColumn.Tone.OFF -> if (gated) Ink.aside else Ink.chrome
}

/** Systemic readiness. It inverts to ink when the day is held: the gate
 *  changes the instruction, never the facts. */
@Composable
private fun ReadinessCard(view: HomeView, modifier: Modifier = Modifier) {
    val card = view.readiness
    val gated = card.gated
    val shape = RoundedCornerShape(3.dp)
    val text = if (gated) Ink.card else Ink.primary
    val quiet = if (gated) Ink.aside else Ink.label
    val line = if (gated) Ink.invertLine else Ink.edge
    Column(modifier.fillMaxWidth().background(if (gated) Ink.primary else Ink.card, shape).border(1.dp, Ink.primary, shape)) {
        Row(
            Modifier.fillMaxWidth().padding(start = 10.dp, end = 10.dp, top = 7.dp, bottom = 5.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Icon(Glyph.Heart, 13.dp, text)
            Text("SYSTEMIC READINESS", style = Type.label(10, 0.1).copy(color = text))
            card.method?.let { Text("· $it", style = Type.label(9, 0.1).copy(color = quiet)) }
            Spacer(Modifier.weight(1f))
            Text(card.band, style = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.06.em, color = text))
        }
        Box(Modifier.fillMaxWidth().height(1.dp).background(line))
        Row(Modifier.fillMaxWidth().padding(start = 10.dp, end = 10.dp, top = 7.dp, bottom = 8.dp)) {
            for (col in card.columns) {
                Column(Modifier.weight(1f).padding(end = 8.dp)) {
                    Text(col.label, style = TextStyle(fontSize = 9.sp, letterSpacing = 0.05.em, color = quiet), modifier = Modifier.padding(bottom = 3.dp))
                    Text(
                        col.`value`,
                        style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = if (col.ask == true && !gated) Ink.accent else text),
                    )
                    Box(Modifier.padding(top = 4.dp)) {
                        if (col.bar == GateColumn.Bar.GAUGE) ReadinessGauge(col.gauge, gated)
                        else FillBar(col.pct ?: 0.0, tone(col.tone, gated), line)
                    }
                    col.note?.let { Text(it, style = TextStyle(fontSize = 10.sp, color = quiet), modifier = Modifier.padding(top = 5.dp)) }
                }
            }
        }
        card.note?.let {
            Text(it, style = TextStyle(fontSize = 10.sp, color = quiet), modifier = Modifier.padding(start = 10.dp, end = 10.dp, bottom = 7.dp))
        }
    }
}

/** An amount, 0–100: a 3 px track and its fill. */
@Composable
private fun FillBar(pct: Double, fill: Color, track: Color) {
    Canvas(Modifier.fillMaxWidth().height(3.dp)) {
        val r = CornerRadius(2.dp.toPx())
        drawRoundRect(track, cornerRadius = r)
        val w = size.width * (pct / 100).toFloat().coerceIn(0f, 1f)
        if (w > 0f) drawRoundRect(fill, size = Size(w, size.height), cornerRadius = r)
    }
}

/** The normal band's place on the gauge's track: GAUGE_NORMAL in
 *  @tekio/core (fusedRead.ts), where `gauge.at` is measured from. */
private const val NORMAL_FROM = 0.3f
private const val NORMAL_TO = 0.7f

/** A reading against the person's own normal: a grey band for the normal and
 *  a dot for the reading (the web's ReadinessGauge, card size). Null draws
 *  the empty track: no reading to place yet. */
@Composable
private fun ReadinessGauge(gauge: GateColumnGauge?, inverted: Boolean) {
    val dotD = 9.dp
    Canvas(Modifier.fillMaxWidth().height(dotD + 3.dp)) {
        val trackH = 3.dp.toPx()
        val dot = dotD.toPx()
        val cy = size.height / 2
        drawRoundRect(
            if (inverted) Ink.invertLine else Ink.edge,
            topLeft = Offset(0f, cy - trackH / 2), size = Size(size.width, trackH), cornerRadius = CornerRadius(2.dp.toPx()),
        )
        if (gauge == null) return@Canvas
        // Band and dot share one inner span, inset by the dot's radius, so a
        // dot pinned to an end still sits whole on the track.
        val left = dot / 2
        val span = size.width - dot
        drawRect(
            if (inverted) Ink.label else Ink.outline,
            topLeft = Offset(left + span * NORMAL_FROM, cy - trackH / 2), size = Size(span * (NORMAL_TO - NORMAL_FROM), trackH),
        )
        val at = Offset(left + span * gauge.at.toFloat().coerceIn(0f, 1f), cy)
        drawCircle(if (inverted) Ink.primary else Ink.card, dot / 2 + 1.5.dp.toPx(), at)
        drawCircle(if (inverted) Ink.card else Ink.primary, dot / 2, at)
    }
}

/** The held day's banner. */
@Composable
private fun Banner(text: String) {
    Row(
        Modifier.fillMaxWidth().padding(top = 8.dp).background(Ink.primary, RoundedCornerShape(3.dp)).padding(horizontal = 10.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(7.dp),
    ) {
        Icon(Glyph.Pause, 13.dp, Ink.card)
        Text(text, style = TextStyle(fontSize = 11.sp, lineHeight = 14.3.sp, color = Ink.card).merge(pretty))
    }
}

@Composable
private fun SectionLabel(label: String, aside: String) {
    Row(verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, style = Type.label(9, 0.14))
        Text(aside, style = Type.note)
    }
}

/** What is missing is the map: the ranked callouts on the body are the list.
 *  Under it, the seven qualities by name, the untouched ones in the accent. */
@Composable
private fun Missing(view: HomeView) {
    Card(Modifier.padding(top = 8.dp)) {
        Column(Modifier.padding(horizontal = 10.dp, vertical = 7.dp)) {
            SectionLabel("WHAT IS MISSING", "— ranked on the body · worst first")
            BodyMapView(view.map.zones, view.map.callouts, view.zeroData, Modifier.padding(top = 2.dp))
            val q = view.qualities
            val line = buildAnnotatedString {
                if (q.line != null) {
                    withStyle(SpanStyle(color = if (view.zeroData) Ink.secondary else Ink.primary)) { append(q.line) }
                } else {
                    q.untouched?.let {
                        withStyle(SpanStyle(fontWeight = FontWeight.SemiBold)) {
                            append("Untouched: ")
                            withStyle(SpanStyle(color = Ink.accent)) { append(it) }
                            append(".")
                        }
                    }
                    if (q.untouched != null && q.short != null) append(" ")
                    q.short?.let {
                        withStyle(SpanStyle(fontWeight = FontWeight.SemiBold)) { append("Short:") }
                        withStyle(SpanStyle(color = Ink.secondary)) { append(" $it.") }
                    }
                }
            }
            Text(line, style = Type.body.merge(pretty), modifier = Modifier.padding(top = 4.dp))
        }
    }
}

private fun tileFill(step: Int?): Color = if (step == null) Ink.card else Ink.ramp[step]
private fun tileEdge(edge: QualityTile.Edge): Color = when (edge) {
    QualityTile.Edge.BLANK -> Ink.edge
    QualityTile.Edge.ACCENT -> Ink.accent
    QualityTile.Edge.RAMP -> Ink.ramp[1]
    QualityTile.Edge.INK -> Ink.ramp[3]
}

/** The whole-body qualities: one state each, all cardio. */
@Composable
private fun WholeBody(view: HomeView) {
    Card(Modifier.padding(top = 8.dp)) {
        Column(Modifier.padding(start = 10.dp, end = 10.dp, top = 7.dp, bottom = 8.dp)) {
            SectionLabel("WHOLE-BODY QUALITIES", "— all cardio · fill = ${view.windowDays} d coverage")
            Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                for (t in view.wholeBody) {
                    Column(
                        Modifier.weight(1f).border(1.dp, Ink.edge, RoundedCornerShape(2.dp)).padding(start = 5.dp, end = 5.dp, top = 4.dp, bottom = 5.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Canvas(Modifier.size(8.dp)) {
                                val r = CornerRadius(1.dp.toPx())
                                val inset = 0.5.dp.toPx()
                                val s = Size(size.width - 2 * inset, size.height - 2 * inset)
                                drawRoundRect(tileFill(t.step), Offset(inset, inset), s, r)
                                drawRoundRect(tileEdge(t.edge), Offset(inset, inset), s, r, style = Stroke(1.dp.toPx()))
                            }
                            Text(t.name, style = TextStyle(fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 0.02.em, color = Ink.primary))
                        }
                        Text(t.note, style = TextStyle(fontSize = 9.sp, color = Ink.secondary), modifier = Modifier.padding(top = 2.dp))
                    }
                }
            }
        }
    }
}

/** Body weight and blood, folded into Home as stats. */
@Composable
private fun Fold(t: FoldTile, modifier: Modifier = Modifier) {
    val shape = RoundedCornerShape(3.dp)
    Column(modifier.background(Ink.card, shape).border(1.dp, Ink.edge, shape).padding(start = 7.dp, end = 7.dp, top = 4.dp, bottom = 5.dp)) {
        Text(t.label, style = TextStyle(fontSize = 8.sp, letterSpacing = 0.08.em, color = Ink.label))
        Text(t.`value`, style = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Ink.primary), modifier = Modifier.padding(top = 1.dp))
        Text(t.note, style = TextStyle(fontSize = 8.sp, color = if (t.accent) Ink.accent else Ink.label))
    }
}
