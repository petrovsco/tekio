// Every Kotlin plugin is declared here, once, so the modules share one copy of
// it: a module asking for one the root already carries, with a version, fails.
plugins {
    alias(libs.plugins.kotlin.jvm) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.serialization) apply false
}
