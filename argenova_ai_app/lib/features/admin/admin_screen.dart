import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../../core/api/config.dart';
import '../../core/api/qdrant_service.dart';
import '../../core/widgets/custom_app_bar.dart';
import '../../core/widgets/custom_card.dart';

class AdminScreen extends ConsumerStatefulWidget {
  const AdminScreen({super.key});

  @override
  ConsumerState<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends ConsumerState<AdminScreen>
    with SingleTickerProviderStateMixin {
  List<Map<String, dynamic>> _employees = [];
  bool _loading = false;
  String? _selectedFilePath;
  String? _selectedFileName;

  @override
  void initState() {
    super.initState();
    _loadEmployees();
  }

  Future<void> _loadEmployees() async {
    setState(() => _loading = true);
    try {
      final qdrant = QdrantService();
      print('📋 Çalışanlar yükleniyor...');
      final employees = await qdrant.getAllData();
      print('📋 Yüklenen çalışan sayısı: ${employees.length}');
      for (final emp in employees) {
        print('📋 ${emp['isim']} - ID: ${emp['id']}');
      }
      setState(() {
        _employees = employees;
        _loading = false;
      });
    } catch (e) {
      print('📋 Çalışan yükleme hatası: $e');
      setState(() => _loading = false);
      _showSnackBar('Veriler yüklenirken hata: $e');
    }
  }

  Future<void> _deleteEmployee(int id) async {
    print('🗑️ Silme işlemi başlatıldı. ID: $id');

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Çalışanı Sil'),
        content: const Text('Bu çalışanı silmek istediğinizden emin misiniz?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Sil'),
          ),
        ],
      ),
    );

    if (confirmed != true) {
      print('🗑️ Silme işlemi iptal edildi');
      return;
    }

    setState(() => _loading = true);
    try {
      final qdrant = QdrantService();
      print('🗑️ Qdrant\'a silme isteği gönderiliyor...');
      final success = await qdrant.deleteEmployee(id);
      print('🗑️ Silme sonucu: $success');

      if (success) {
        _showSnackBar('Çalışan silindi');
        print('🗑️ Çalışanlar yeniden yükleniyor...');
        _loadEmployees();
      } else {
        _showSnackBar('Çalışan silinirken hata oluştu');
      }
    } catch (e) {
      print('🗑️ Silme hatası: $e');
      _showSnackBar('Hata: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  // Dark tema uyumlu renkler için yardımcı fonksiyonlar
  Color _getFillColor() {
    return Theme.of(context).brightness == Brightness.dark
        ? Colors.grey.withOpacity(0.1)
        : Colors.grey.withOpacity(0.05);
  }

  Color _getShadowColor() {
    return Theme.of(context).brightness == Brightness.dark
        ? Colors.black.withOpacity(0.3)
        : Colors.black.withOpacity(0.05);
  }

  Future<void> _pickExcelFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['xlsx'],
    );
    if (result != null && result.files.single.path != null) {
      setState(() {
        _selectedFilePath = result.files.single.path;
        _selectedFileName = result.files.single.name;
      });
      _showSnackBar('Dosya seçildi: $_selectedFileName');
    } else {
      setState(() {
        _selectedFilePath = null;
        _selectedFileName = null;
      });
      _showSnackBar('Dosya seçilmedi');
    }
  }

  Future<void> _uploadEmployeesFromExcel() async {
    setState(() => _loading = true);
    try {
      if (_selectedFilePath == null) {
        _showSnackBar('Lütfen önce bir dosya seçin');
        setState(() => _loading = false);
        return;
      }
      var uri = Uri.parse('${ApiConfig.apiBaseUrl}/upload-employees');
      var request = http.MultipartRequest('POST', uri)
        ..files.add(
          await http.MultipartFile.fromPath('file', _selectedFilePath!),
        );

      var response = await request.send();

      if (response.statusCode == 200) {
        _showSnackBar('Excel dosyasından çalışanlar başarıyla yüklendi');
        setState(() {
          _selectedFilePath = null;
          _selectedFileName = null;
        });
        _loadEmployees(); // Listeyi güncelle
      } else {
        _showSnackBar('Yükleme başarısız: ${response.statusCode}');
      }
    } catch (e) {
      _showSnackBar('Hata: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _deleteAllEmployees() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Tüm Çalışanları Sil'),
        content: const Text(
          'Tüm çalışanları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('İptal'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Tümünü Sil'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _loading = true);
    try {
      final uri = Uri.parse('${ApiConfig.apiBaseUrl}/employees/all');
      final response = await http.delete(uri);
      if (response.statusCode == 200) {
        _showSnackBar('Tüm çalışanlar silindi');
        _loadEmployees();
      } else {
        _showSnackBar('Toplu silme başarısız: ${response.statusCode}');
      }
    } catch (e) {
      _showSnackBar('Hata: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: 'Admin Paneli'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    icon: Icon(Icons.file_open),
                    label: Text('Dosya Seç'),
                    onPressed: _loading ? null : _pickExcelFile,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    icon: Icon(Icons.upload_file),
                    label: Text('Aktar'),
                    onPressed: _loading ? null : _uploadEmployeesFromExcel,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    icon: Icon(Icons.delete_forever),
                    label: Text('Tümünü Sil'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                    ),
                    onPressed: _loading ? null : _deleteAllEmployees,
                  ),
                ),
              ],
            ),
          ),
          if (_selectedFileName != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                children: [
                  Icon(Icons.insert_drive_file, color: Colors.blueGrey),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _selectedFileName!,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          Expanded(child: _buildEmployeeList()),
        ],
      ),
    );
  }

  Widget _buildEmployeeList() {
    return _loading
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Theme.of(context).primaryColor,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Çalışanlar yükleniyor...',
                  style: TextStyle(
                    color: Theme.of(context).primaryColor,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          )
        : SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CustomCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.people_alt_rounded,
                            color: Theme.of(context).primaryColor,
                            size: 24,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Mevcut Çalışanlar',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Theme.of(
                                context,
                              ).primaryColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              '${_employees.length} kişi',
                              style: TextStyle(
                                color: Theme.of(context).primaryColor,
                                fontWeight: FontWeight.w600,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (_employees.isEmpty)
                        Center(
                          child: Column(
                            children: [
                              Icon(
                                Icons.people_outline_rounded,
                                size: 64,
                                color: Colors.grey.withOpacity(0.5),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'Henüz çalışan eklenmemiş',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey.withOpacity(0.7),
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Yeni çalışan eklemek için "Ekle" sekmesini kullanın',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey.withOpacity(0.5),
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        )
                      else
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _employees.length,
                          itemBuilder: (context, index) {
                            final employee = _employees[index];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              decoration: BoxDecoration(
                                color: Theme.of(context).cardColor,
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color:
                                        Theme.of(context).brightness ==
                                            Brightness.dark
                                        ? Colors.black.withOpacity(0.3)
                                        : Colors.black.withOpacity(0.05),
                                    blurRadius: 4,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: ListTile(
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 8,
                                ),
                                leading: CircleAvatar(
                                  backgroundColor: Theme.of(
                                    context,
                                  ).primaryColor.withOpacity(0.1),
                                  child: Text(
                                    (employee['isim'] ?? '?')[0].toUpperCase(),
                                    style: TextStyle(
                                      color: Theme.of(context).primaryColor,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                title: Text(
                                  employee['isim'] ?? '',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 16,
                                  ),
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.access_time_rounded,
                                          size: 14,
                                          color: Colors.grey.withOpacity(0.7),
                                        ),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            (employee['toplam_mesai'] is List)
                                                ? (employee['toplam_mesai']
                                                          as List)
                                                      .join(', ')
                                                : (employee['toplam_mesai']
                                                          ?.toString() ??
                                                      ''),
                                            style: TextStyle(
                                              color: Colors.grey.withOpacity(
                                                0.7,
                                              ),
                                              fontSize: 13,
                                            ),
                                            overflow: TextOverflow.ellipsis,
                                            maxLines: 1,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.calendar_today_rounded,
                                          size: 14,
                                          color: Colors.grey.withOpacity(0.7),
                                        ),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            (employee['tarih_araligi'] is List)
                                                ? (employee['tarih_araligi']
                                                          as List)
                                                      .join(', ')
                                                : (employee['tarih_araligi']
                                                          ?.toString() ??
                                                      ''),
                                            style: TextStyle(
                                              color: Colors.grey.withOpacity(
                                                0.7,
                                              ),
                                              fontSize: 13,
                                            ),
                                            overflow: TextOverflow.ellipsis,
                                            maxLines: 1,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      decoration: BoxDecoration(
                                        color: Colors.red.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: IconButton(
                                        icon: const Icon(
                                          Icons.delete_rounded,
                                          color: Colors.red,
                                          size: 20,
                                        ),
                                        onPressed: () => _deleteEmployee(
                                          employee['id'] ?? 0,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                    ],
                  ),
                ),
              ],
            ),
          );
  }
}

// Yardımcı fonksiyonlar (en sona ekle):
DateTimeRange? _parseDateRange(String text) {
  try {
    final parts = text.split('/');
    if (parts.length == 2) {
      final start = DateTime.parse(parts[0]);
      final end = DateTime.parse(parts[1]);
      return DateTimeRange(start: start, end: end);
    }
  } catch (_) {}
  return null;
}

String _formatDate(DateTime date) {
  return '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
}
