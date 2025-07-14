import 'dart:convert';

import 'package:http/http.dart' as http;

final apiUrl = 'http://192.168.2.191:3000/api'; // Yeni Node.js API sunucusu

// API'den mevcut isimleri çeken fonksiyon
Future<List<String>> getExistingNamesFromApi() async {
  try {
    final response = await http.get(Uri.parse('$apiUrl/employees'));
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List;
      final existingNames = <String>{};
      for (final item in data) {
        if (item['isim'] != null) {
          existingNames.add(item['isim'] as String);
        }
      }
      return existingNames.toList();
    } else {
      print('API\'den veri çekilemedi: ${response.statusCode}');
      return [];
    }
  } catch (e) {
    print('API\'den veri çekerken hata: $e');
    return [];
  }
}

// Dinamik veri oluşturucu fonksiyon
Future<List<Map<String, dynamic>>> generateSampleData() async {
  // API'den mevcut isimleri al
  final existingNames = await getExistingNamesFromApi();

  // Eğer API'de hiç veri yoksa varsayılan isimler kullan
  final sampleNames = existingNames.isNotEmpty
      ? existingNames
      : [
          'Ali',
          'Veli',
          'Ayşe',
          'Mehmet',
          'Zeynep',
          'Ahmet',
          'Fatma',
          'Kemal',
          'Elif',
          'Burak',
          'Can',
          'Deniz',
          'Ece',
          'Fırat',
          'Gizem',
          'Hakan',
          'İrem',
          'Jale',
        ];

  final sampleDateRanges = [
    '2024-07-01/2024-07-07',
    '2024-07-08/2024-07-14',
    '2024-07-15/2024-07-21',
    '2024-07-22/2024-07-28',
    '2024-07-29/2024-08-04',
    '2024-08-05/2024-08-11',
  ];

  final veriler = <Map<String, dynamic>>[];

  for (int i = 0; i < sampleNames.length; i++) {
    final name = sampleNames[i];
    final dateRange = sampleDateRanges[i % sampleDateRanges.length];
    final totalHours = 30 + (i * 2) % 20; // 30-50 saat arası

    // Dinamik günlük mesai oluştur
    final dailyHours = <String, int>{};
    final days = [
      'pazartesi',
      'sali',
      'carsamba',
      'persembe',
      'cuma',
      'cumartesi',
      'pazar',
    ];
    int remainingHours = totalHours;

    for (int j = 0; j < days.length - 1; j++) {
      final dayHours = 4 + (i + j) % 4; // 4-7 saat arası
      dailyHours[days[j]] = dayHours;
      remainingHours -= dayHours;
    }
    // Son gün kalan saatleri al
    dailyHours[days.last] = remainingHours > 0 ? remainingHours : 4;

    veriler.add({
      "isim": name,
      "tarih_araligi": dateRange,
      "toplam_mesai": totalHours,
      "gunluk_mesai": dailyHours,
    });
  }

  return veriler;
}

Future<void> main() async {
  // Verileri dinamik olarak oluştur
  final veriler = await generateSampleData();

  int i = 1;
  for (final payload in veriler) {
    // API'ye ekle
    final res = await http.post(
      Uri.parse('$apiUrl/employees'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    print("${payload['isim']} için eklendi, API yanıtı: ${res.statusCode}");
    await Future.delayed(const Duration(milliseconds: 500));
    i++;
  }
  print("Tüm veriler başarıyla eklendi.");
}
