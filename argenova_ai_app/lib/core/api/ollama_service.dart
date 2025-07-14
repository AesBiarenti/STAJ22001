import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import 'config.dart';

class OllamaService {
  static const String apiUrl = ApiConfig.apiBaseUrl;

  // API kullanılabilirlik kontrolü
  Future<bool> _isApiAvailable() async {
    try {
      final response = await http
          .get(
            Uri.parse('$apiUrl/employees'),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<String> generateAnswer(String prompt) async {
    if (!await _isApiAvailable()) {
      throw Exception('API servisi kullanılamıyor');
    }

    final response = await http.post(
      Uri.parse('$apiUrl/chat'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'question': prompt}),
    );
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      // Flask API response formatı: {"answer": "...", "success": true}
      return data['answer']?.toString() ?? '';
    } else {
      throw Exception('Yanıt alınamadı: ${response.body}');
    }
  }

  // Gerçek embedding oluşturma metodu
  Future<List<double>> getEmbedding(String text) async {
    if (!await _isApiAvailable()) {
      // API kullanılamıyorsa fallback embedding
      return List.generate(384, (index) => (index * 0.1) % 1.0);
    }

    try {
      final response = await http.post(
        Uri.parse('$apiUrl/embedding'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'text': text}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Flask API response formatı: {"embedding": [...], "success": true}
        return List<double>.from(data['embedding'] ?? []);
      } else {
        // Hata durumunda fallback embedding
        return List.generate(384, (index) => (index * 0.1) % 1.0);
      }
    } catch (e) {
      // Hata durumunda fallback embedding
      return List.generate(384, (index) => (index * 0.1) % 1.0);
    }
  }

  // Stream yanıt oluşturma metodu
  Stream<String> streamGenerateAnswer(
    String prompt,
    List<Map<String, dynamic>> context, {
    List<Map<String, dynamic>>? chatHistory,
  }) async* {
    try {
      // API kontrolü
      if (!await _isApiAvailable()) {
        yield 'Üzgünüm, şu anda AI servisi kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
        return;
      }

      // Context'i prompt'a ekle
      String enhancedPrompt = _buildEnhancedPrompt(
        prompt,
        context,
        chatHistory,
      );

      // API'ye istek gönder
      final response = await http.post(
        Uri.parse('$apiUrl/chat'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'question': enhancedPrompt}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Flask API response formatı: {"answer": "...", "success": true}
        final answer = data['answer']?.toString() ?? '';

        // Yanıtı karakterler halinde stream et
        for (int i = 0; i < answer.length; i++) {
          yield answer[i];
          await Future.delayed(const Duration(milliseconds: 50));
        }
      } else {
        yield 'Üzgünüm, yanıt alınamadı. Lütfen daha sonra tekrar deneyin.';
      }
    } catch (e) {
      yield 'Bir hata oluştu: $e';
    }
  }

  // Gelişmiş prompt oluşturma
  String _buildEnhancedPrompt(
    String question,
    List<Map<String, dynamic>> context,
    List<Map<String, dynamic>>? chatHistory,
  ) {
    StringBuffer prompt = StringBuffer();

    // Sistem talimatları
    prompt.writeln(
      'Sen bir çalışan yönetim sistemi asistanısın. Aşağıdaki çalışan verilerini kullanarak soruları yanıtla:',
    );

    // Context verilerini ekle
    if (context.isNotEmpty) {
      prompt.writeln('\nÇalışan Verileri:');
      for (final employee in context) {
        prompt.writeln(
          '- ${employee['isim']}: ${employee['toplam_mesai']} saat (${employee['tarih_araligi']})',
        );
      }
    }

    // Sohbet geçmişini ekle
    if (chatHistory != null && chatHistory.isNotEmpty) {
      prompt.writeln('\nSohbet Geçmişi:');
      for (final msg in chatHistory) {
        prompt.writeln('${msg['role']}: ${msg['content']}');
      }
    }

    // Kullanıcı sorusunu ekle
    prompt.writeln('\nSoru: $question');
    prompt.writeln('\nYanıt:');

    return prompt.toString();
  }
}
