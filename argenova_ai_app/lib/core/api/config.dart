class ApiConfig {
  // Release modunda (APK) Docker Compose ayarları varsayılan olsun
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue:
        'http://192.168.2.191:5000/api', // <-- kendi bilgisayarının IP adresi
  );

  static const String qdrantUrl = String.fromEnvironment(
    'QDRANT_URL',
    defaultValue:
        'http://192.168.2.191:6333', // <-- kendi bilgisayarının IP adresi
  );

  static const int timeoutSeconds = 30;
  static const int retryAttempts = 3;
}
