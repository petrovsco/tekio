// No plugins here on purpose. Each module loads its own Kotlin plugin: :app's
// must sit beside the Android plugin it extends, which only :app can load,
// because the cloud sessions cannot download it and leave :app out.
