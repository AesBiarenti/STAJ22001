class ApiConfig {
  // Development ortamı için varsayılan değerler
  static const String apiBaseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:5000/api', // <-- localhost yerine 10.0.2.2
  );

  static const String qdrantUrl = String.fromEnvironment(
    'QDRANT_URL',
    defaultValue: 'http://localhost:6333', // Docker Compose Qdrant
  );

  static const int timeoutSeconds = 30;
  static const int retryAttempts = 3;
}
