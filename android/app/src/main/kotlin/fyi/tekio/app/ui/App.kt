package fyi.tekio.app.ui

import androidx.compose.runtime.Composable
import fyi.tekio.app.AppModel

/** Signed out, the one sign-in screen; signed in, Home. The other screens
 *  join here as RFC 0096's steps bring them. */
@Composable
fun App(model: AppModel) {
    if (model.signedIn) HomeScreen(model) else SignInScreen(model)
}
