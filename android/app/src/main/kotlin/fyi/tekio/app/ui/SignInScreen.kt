package fyi.tekio.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import fyi.tekio.app.AppModel

private val LOOKS_LIKE_EMAIL = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")

/** The one screen a signed-out person sees, as on the web (RFC 0003): an
 *  address and a link by email. The same link makes the account. */
@Composable
fun SignInScreen(model: AppModel) {
    var email by rememberSaveable { mutableStateOf("") }
    val valid = LOOKS_LIKE_EMAIL.matches(email.trim())
    val send = { if (valid) model.sendLink(email) }

    Column(
        Modifier.fillMaxSize().background(Ink.paper).safeDrawingPadding().imePadding().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Column(Modifier.widthIn(max = 340.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("TEKIŌ", style = Type.wordmark)
                Text("Tells you what's missing.", style = Type.sub)
            }
            val sentTo = model.linkSentTo
            if (sentTo != null) {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        buildAnnotatedString {
                            append("Check your email. We sent a sign-in link to ")
                            withStyle(SpanStyle(fontWeight = FontWeight.SemiBold)) { append(sentTo) }
                            append(".")
                        },
                        style = Type.body.copy(fontSize = 14.sp, lineHeight = 19.6.sp),
                    )
                    Text("Open it on this phone: it comes back to the app and signs you in.", style = Type.sub)
                    model.signInError?.let { Text(it, style = Type.body) }
                    Btn("Use a different address", onClick = { model.startOver() }, solid = false)
                }
            } else {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Field("Email", email, { email = it }, placeholder = "you@example.com", keyboardType = KeyboardType.Email, onDone = send)
                    model.signInError?.let { Text(it, style = Type.body) }
                    Btn(
                        if (model.busy) "Sending…" else "Send sign-in link",
                        onClick = send,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = valid,
                        working = model.busy,
                    )
                    Text("New here? The same link makes your account.", style = Type.meta.copy(color = Ink.label, lineHeight = 15.4.sp))
                }
            }
        }
    }
}
