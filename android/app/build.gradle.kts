
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

// The app's version follows the web's: one product, one number (package.json).
val webVersion = Regex("\"version\":\\s*\"([^\"]+)\"").find(rootDir.parentFile.resolve("package.json").readText())!!.groupValues[1]
val (major, minor, patch) = webVersion.split(".").map { it.toInt() }

android {
    namespace = "fyi.tekio.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "fyi.tekio.app"
        minSdk = 26
        targetSdk = 36
        versionName = webVersion
        versionCode = major * 1_000_000 + minor * 1_000 + patch
        buildConfigField("String", "API_URL", "\"${providers.gradleProperty("tekio.apiUrl").get()}\"")
    }

    // Test builds are signed with one debug key kept beside the app, so a new
    // build installs over the last one on the phone instead of asking for an
    // uninstall. It signs nothing that goes to the store.
    signingConfigs {
        getByName("debug") {
            storeFile = file("debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".test"
            versionNameSuffix = "-test"
        }
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources.excludes += setOf("META-INF/*.kotlin_module", "META-INF/versions/9/OSGI-INF/MANIFEST.MF")
    }
}

kotlin {
    compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) }
}

dependencies {
    implementation(project(":api"))
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.foundation)
    implementation(libs.compose.material3)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.activity.compose)
    implementation(libs.lifecycle.runtime.compose)
    implementation(libs.lifecycle.viewmodel.compose)
    implementation(libs.coroutines.android)
    debugImplementation(libs.compose.ui.tooling)
}
