import 'package:flutter/material.dart';

import '../api/config.dart';

class ApiStatusWidget extends StatelessWidget {
  const ApiStatusWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      margin: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            '🔧 API Konfigürasyonu',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Text(
            'API URL: ${ApiConfig.apiBaseUrl}',
            style: const TextStyle(fontSize: 12),
          ),
          Text(
            'Qdrant URL: ${ApiConfig.qdrantUrl}',
            style: const TextStyle(fontSize: 12),
          ),
          Text(
            'Timeout: ${ApiConfig.timeoutSeconds}s',
            style: const TextStyle(fontSize: 12),
          ),
        ],
      ),
    );
  }
}
