import 'dart:convert';

import 'package:http/http.dart' as http;

import 'config.dart';

class QdrantService {
  static const String apiUrl = ApiConfig.apiBaseUrl;

  // Tüm CRUD işlemleri artık API üzerinden
  Future<List<Map<String, dynamic>>> getAllData() async {
    try {
      final response = await http.get(
        Uri.parse('$apiUrl/employees'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Flask API response formatı: {"data": [...], "success": true, "count": 5}
        return List<Map<String, dynamic>>.from(data['data'] ?? []);
      } else {
        throw Exception('Çalışan verileri alınamadı: ${response.body}');
      }
    } catch (e) {
      throw Exception('API bağlantı hatası: $e');
    }
  }

  Future<bool> addEmployee(Map<String, dynamic> employeeData) async {
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/employees'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(employeeData),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      throw Exception('Çalışan ekleme hatası: $e');
    }
  }

  Future<bool> updateEmployee(int id, Map<String, dynamic> newData) async {
    try {
      final response = await http.put(
        Uri.parse('$apiUrl/employees/$id'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(newData),
      );
      return response.statusCode == 200;
    } catch (e) {
      throw Exception('Çalışan güncelleme hatası: $e');
    }
  }

  Future<bool> deleteEmployee(int id) async {
    try {
      final response = await http.delete(
        Uri.parse('$apiUrl/employees/$id'),
        headers: {'Content-Type': 'application/json'},
      );
      return response.statusCode == 200;
    } catch (e) {
      throw Exception('Çalışan silme hatası: $e');
    }
  }

  // Context alma - API üzerinden
  Future<List<Map<String, dynamic>>> getSmartContext(
    List<double> embedding,
    String query,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/chat/context'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'embedding': embedding, 'query': query}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Flask API response formatı: {"context": [...], "success": true}
        return List<Map<String, dynamic>>.from(data['context'] ?? []);
      } else {
        // API çalışmıyorsa, tüm verileri al
        return await getAllData();
      }
    } catch (e) {
      // Hata durumunda tüm verileri al
      return await getAllData();
    }
  }
}
