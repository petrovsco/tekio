package fyi.tekio.app.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Buttons in the chip tones one size up (§8): solid ink commits, ghost is
 *  the third-rank action. A spinner shows while a commit is on its way. */
@Composable
fun Btn(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    solid: Boolean = true,
    enabled: Boolean = true,
    working: Boolean = false,
) {
    val shape = RoundedCornerShape(3.dp)
    Row(
        modifier
            .alpha(if (enabled) 1f else 0.4f)
            .then(if (solid) Modifier.background(Ink.primary, shape).border(1.dp, Ink.primary, shape) else Modifier)
            .clickable(enabled = enabled && !working, onClick = onClick)
            .padding(horizontal = if (solid) 12.dp else 0.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (working) CircularProgressIndicator(Modifier.size(13.dp), color = if (solid) Ink.card else Ink.primary, strokeWidth = 1.8.dp)
        Text(text, style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = if (solid) Ink.card else Ink.label))
    }
}

/** A field (§8): white ground, a hairline that goes ink on focus, and a 9 px
 *  tracked label above it. No focus glow; the border is the focus signal. */
@Composable
fun Field(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String = "",
    keyboardType: KeyboardType = KeyboardType.Text,
    onDone: () -> Unit = {},
) {
    var focused by remember { mutableStateOf(false) }
    Column {
        Text(label.uppercase(), style = Type.label(9, 0.12), modifier = Modifier.padding(bottom = 4.dp))
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            singleLine = true,
            textStyle = TextStyle(fontSize = 16.sp, color = Ink.primary),
            cursorBrush = SolidColor(Ink.primary),
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType, imeAction = ImeAction.Done, autoCorrectEnabled = false),
            keyboardActions = KeyboardActions(onDone = { onDone() }),
            modifier = Modifier.fillMaxWidth().onFocusChanged { focused = it.isFocused },
            decorationBox = { inner ->
                Box(
                    Modifier
                        .fillMaxWidth()
                        .background(Ink.card, RoundedCornerShape(3.dp))
                        .border(BorderStroke(1.dp, if (focused) Ink.primary else Ink.edge), RoundedCornerShape(3.dp))
                        .padding(horizontal = 10.dp, vertical = 8.dp),
                ) {
                    if (value.isEmpty()) Text(placeholder, style = TextStyle(fontSize = 16.sp, color = Ink.aside))
                    inner()
                }
            },
        )
    }
}

/** A white card with the 1 px edge and 3 px radius (§2). */
@Composable
fun Card(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Box(
        modifier
            .fillMaxWidth()
            .background(Ink.card, RoundedCornerShape(3.dp))
            .border(1.dp, Ink.edge, RoundedCornerShape(3.dp)),
    ) { content() }
}
