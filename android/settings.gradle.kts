// The Android app (RFC 0096): `:api` is the typed client and the sign-in, in
// plain Kotlin with no Android in it, so it builds and tests on any JVM and can
// become shared code if the iOS app ever wants it; `:app` is the phone app.
pluginManagement {
    repositories {
        google {
            // Only what Google publishes: everything else is asked of Maven Central.
            content {
                includeGroupByRegex("androidx.*")
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google {
            // Only what Google publishes: everything else is asked of Maven Central.
            content {
                includeGroupByRegex("androidx.*")
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
            }
        }
        mavenCentral()
    }
}

rootProject.name = "tekio-android"

include(":api")

// The app needs the Android SDK. A machine without one (a cloud session that
// cannot download it) still builds and tests `:api`; CI has the SDK and builds both.
val sdk = System.getenv("ANDROID_HOME") ?: System.getenv("ANDROID_SDK_ROOT")
    ?: file("local.properties").takeIf { it.exists() }?.readLines()
        ?.firstOrNull { it.startsWith("sdk.dir=") }?.substringAfter("=")
if (sdk != null) include(":app")
