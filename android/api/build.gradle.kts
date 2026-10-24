// The typed client, generated at build time from the API's own description
// (packages/client/openapi.json, written by `npm run api:client`), so the app
// can never call a route the API does not have. Plus the sign-in and the body
// map's geometry, read from @tekio/core's JSON. No Android in here.
plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.openapi.generator)
}

val repo = rootDir.parentFile
val generated = layout.buildDirectory.dir("generated/openapi")
val sharedDir: File = layout.buildDirectory.dir("generated/shared").get().asFile

openApiGenerate {
    generatorName.set("kotlin")
    inputSpec.set(repo.resolve("packages/client/openapi.json").path)
    outputDir.set(generated.get().asFile.path)
    packageName.set("fyi.tekio.client")
    configOptions.set(
        mapOf(
            "library" to "jvm-okhttp4",
            "serializationLibrary" to "kotlinx_serialization",
            "omitGradleWrapper" to "true",
            "enumPropertyNaming" to "UPPERCASE",
        ),
    )
    // The API's numbers are measurements and counts, never money: plain doubles.
    typeMappings.set(mapOf("number" to "kotlin.Double", "decimal" to "kotlin.Double"))
    generateApiTests.set(false)
    generateModelTests.set(false)
    generateApiDocumentation.set(false)
    generateModelDocumentation.set(false)
}

// The body map every client draws (RFC 0096), copied from the core package so
// there is one file, not two.
val copyBodyMap by tasks.registering(Copy::class) {
    from(repo.resolve("packages/core/src/bodyMap.json"))
    into(sharedDir.resolve("fyi/tekio"))
}

sourceSets {
    main {
        kotlin.srcDir(generated.map { it.dir("src/main/kotlin") })
        resources.srcDir(sharedDir)
    }
}

tasks.named("compileKotlin") { dependsOn(tasks.openApiGenerate) }
tasks.named("processResources") { dependsOn(copyBodyMap) }

// Bytecode the app's Java 17 target can take, whatever JDK runs the build.
java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}
kotlin {
    compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17) }
}

dependencies {
    api(libs.okhttp)
    api(libs.serialization.json)
    testImplementation(libs.junit)
    testImplementation(libs.okhttp.mockwebserver)
}
