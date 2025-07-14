import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _dateRangeController = TextEditingController();
  final _totalHoursController = TextEditingController();
  final _evaluationController = TextEditingController();

  final Map<String, TextEditingController> _dailyHoursControllers = {
    'pazartesi': TextEditingController(),
    'sali': TextEditingController(),
    'carsamba': TextEditingController(),
    'persembe': TextEditingController(),
    'cuma': TextEditingController(),
    'cumartesi': TextEditingController(),
    'pazar': TextEditingController(),
  };

  List<Map<String, dynamic>> _employees = [];
  bool _loading = false;
  int? _editingEmployeeId;
  late TabController _tabController;
  bool _hasNewEmployee = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() {
        // Tab değiştiğinde UI'ı güncelle
      });
      if (_tabController.index == 0 && _hasNewEmployee) {
        setState(() {
          _hasNewEmployee = false;
        });
      }
    });
    _loadEmployees();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameController.dispose();
    _dateRangeController.dispose();
    _totalHoursController.dispose();
    for (final controller in _dailyHoursControllers.values) {
      controller.dispose();
    }
    super.dispose();
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

  Future<void> _addEmployee() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      final qdrant = QdrantService();

      // Günlük mesai verilerini topla (tüm günler dahil)
      final dailyHours = <String, int>{};
      for (final entry in _dailyHoursControllers.entries) {
        final hours = int.tryParse(entry.value.text) ?? 0;
        dailyHours[entry.key] = hours; // 0 da olsa ekle
      }

      // Toplam mesaiyi 7 gün üzerinden hesapla
      final totalHours = dailyHours.values.fold(0, (a, b) => a + b);

      final employeeData = {
        'isim': _nameController.text.trim(),
        'tarih_araligi': _dateRangeController.text.trim(),
        'toplam_mesai': totalHours,
        'gunluk_mesai': dailyHours,
      };

      final success = await qdrant.addEmployee(employeeData);

      if (success) {
        _showSnackBar('Çalışan başarıyla eklendi');
        _clearForm();
        _loadEmployees();
        setState(() {
          _hasNewEmployee = true;
        });
        _tabController.animateTo(0); // Otomatik olarak listeye geç
      } else {
        _showSnackBar('Çalışan eklenirken hata oluştu');
      }
    } catch (e) {
      _showSnackBar('Hata: $e');
    } finally {
      setState(() => _loading = false);
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

  void _startEditEmployee(Map<String, dynamic> employee) {
    setState(() {
      _editingEmployeeId = employee['id'];
      _nameController.text = employee['isim'] ?? '';
      _dateRangeController.text = employee['tarih_araligi'] ?? '';
      _totalHoursController.text = (employee['toplam_mesai'] ?? '').toString();
      final gunluk = employee['gunluk_mesai'] as Map<String, dynamic>? ?? {};
      for (final key in _dailyHoursControllers.keys) {
        _dailyHoursControllers[key]?.text = (gunluk[key] ?? '').toString();
      }
    });
  }

  Future<void> _saveEditEmployee() async {
    if (!_formKey.currentState!.validate() || _editingEmployeeId == null)
      return;
    setState(() => _loading = true);
    try {
      final qdrant = QdrantService();
      final dailyHours = <String, int>{};
      for (final entry in _dailyHoursControllers.entries) {
        final hours = int.tryParse(entry.value.text) ?? 0;
        dailyHours[entry.key] = hours; // 0 da olsa ekle
      }
      // Toplam mesaiyi 7 gün üzerinden hesapla
      final totalHours = dailyHours.values.fold(0, (a, b) => a + b);
      final employeeData = {
        'isim': _nameController.text.trim(),
        'tarih_araligi': _dateRangeController.text.trim(),
        'toplam_mesai': totalHours,
        'gunluk_mesai': dailyHours,
      };
      final success = await qdrant.updateEmployee(
        _editingEmployeeId!,
        employeeData,
      );
      if (success) {
        _showSnackBar('Çalışan güncellendi');
        _clearForm();
        _editingEmployeeId = null;
        _loadEmployees();
      } else {
        _showSnackBar('Çalışan güncellenirken hata oluştu');
      }
    } catch (e) {
      _showSnackBar('Hata: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  void _clearForm() {
    _formKey.currentState?.reset();
    _nameController.clear();
    _dateRangeController.clear();
    _totalHoursController.clear();
    _evaluationController.clear();
    for (final controller in _dailyHoursControllers.values) {
      controller.clear();
    }
    _editingEmployeeId = null;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(title: 'Admin Paneli'),
      body: Column(
        children: [
          // Güzelleştirilmiş TabBar
          Container(
            margin: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Theme.of(context).primaryColor.withOpacity(0.1),
                  Theme.of(context).primaryColor.withOpacity(0.05),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: TabBar(
              controller: _tabController,
              labelColor: Colors.white,
              unselectedLabelColor:
                  Theme.of(context).brightness == Brightness.dark
                  ? Colors.white.withOpacity(0.7)
                  : Theme.of(context).primaryColor.withOpacity(0.7),
              indicator: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Theme.of(context).primaryColor,
                    Theme.of(context).primaryColor.withOpacity(0.8),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Theme.of(context).primaryColor.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              padding: const EdgeInsets.all(4),
              labelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.5,
              ),
              unselectedLabelStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                letterSpacing: 0.5,
              ),
              tabs: [
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.people_alt_rounded,
                        size: 20,
                        color: _tabController.index == 0
                            ? Colors.white
                            : (Theme.of(context).brightness == Brightness.dark
                                  ? Colors.white.withOpacity(0.7)
                                  : Theme.of(
                                      context,
                                    ).primaryColor.withOpacity(0.7)),
                      ),
                      const SizedBox(width: 8),
                      const Text('Çalışanlar'),
                      if (_hasNewEmployee)
                        Container(
                          margin: const EdgeInsets.only(left: 6),
                          padding: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.red.withOpacity(0.3),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: const Icon(
                            Icons.fiber_manual_record,
                            color: Colors.white,
                            size: 8,
                          ),
                        ),
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        _editingEmployeeId == null
                            ? Icons.person_add_rounded
                            : Icons.edit_rounded,
                        size: 20,
                        color: _tabController.index == 1
                            ? Colors.white
                            : (Theme.of(context).brightness == Brightness.dark
                                  ? Colors.white.withOpacity(0.7)
                                  : Theme.of(
                                      context,
                                    ).primaryColor.withOpacity(0.7)),
                      ),
                      const SizedBox(width: 8),
                      Text(_editingEmployeeId == null ? 'Ekle' : 'Düzenle'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Çalışan Listesi Sekmesi
                _buildEmployeeList(),
                // Çalışan Ekle/Düzenle Sekmesi
                _buildEmployeeForm(),
              ],
            ),
          ),
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
                                        Text(
                                          '${employee['toplam_mesai']} saat',
                                          style: TextStyle(
                                            color: Colors.grey.withOpacity(0.7),
                                            fontSize: 13,
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
                                            employee['tarih_araligi'] ?? '',
                                            style: TextStyle(
                                              color: Colors.grey.withOpacity(
                                                0.7,
                                              ),
                                              fontSize: 13,
                                            ),
                                            overflow: TextOverflow.ellipsis,
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
                                        color: Colors.blue.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: IconButton(
                                        icon: const Icon(
                                          Icons.edit_rounded,
                                          color: Colors.blue,
                                          size: 20,
                                        ),
                                        onPressed: () {
                                          _startEditEmployee(employee);
                                          _tabController.animateTo(1);
                                        },
                                      ),
                                    ),
                                    const SizedBox(width: 8),
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

  Widget _buildEmployeeForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: CustomCard(
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    _editingEmployeeId == null
                        ? Icons.person_add_rounded
                        : Icons.edit_rounded,
                    color: Theme.of(context).primaryColor,
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _editingEmployeeId == null
                        ? 'Yeni Çalışan Ekle'
                        : 'Çalışan Düzenle',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (_editingEmployeeId != null) ...[
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'Düzenleme Modu',
                        style: TextStyle(
                          color: Colors.orange,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 16),
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: _getShadowColor(),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: 'İsim',
                    prefixIcon: const Icon(Icons.person_rounded),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: Theme.of(context).primaryColor,
                        width: 2,
                      ),
                    ),
                    filled: true,
                    fillColor: _getFillColor(),
                  ),
                  validator: (value) {
                    if (value?.trim().isEmpty ?? true) {
                      return 'İsim gerekli';
                    }
                    return null;
                  },
                ),
              ),
              const SizedBox(height: 16),
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: _getShadowColor(),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: TextFormField(
                  controller: _dateRangeController,
                  readOnly: true,
                  decoration: InputDecoration(
                    labelText: 'Tarih Aralığı',
                    hintText: 'örn: 2024-07-01/2024-07-07',
                    prefixIcon: const Icon(Icons.calendar_today_rounded),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: Theme.of(context).primaryColor,
                        width: 2,
                      ),
                    ),
                    filled: true,
                    fillColor: _getFillColor(),
                  ),
                  onTap: () async {
                    final now = DateTime.now();
                    final picked = await showDateRangePicker(
                      context: context,
                      firstDate: DateTime(now.year - 2),
                      lastDate: DateTime(now.year + 2),
                      initialDateRange: _dateRangeController.text.isNotEmpty
                          ? _parseDateRange(_dateRangeController.text)
                          : null,
                    );
                    if (picked != null) {
                      final start = picked.start;
                      final end = picked.end;
                      final formatted =
                          '${_formatDate(start)}/${_formatDate(end)}';
                      setState(() {
                        _dateRangeController.text = formatted;
                      });
                    }
                  },
                  validator: (value) {
                    if (value?.trim().isEmpty ?? true) {
                      return 'Tarih aralığı gerekli';
                    }
                    return null;
                  },
                ),
              ),
              // Toplam saat otomatik göster
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: Row(
                  children: [
                    Icon(
                      Icons.access_time_rounded,
                      color: Theme.of(context).primaryColor,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'Toplam Mesai:',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Builder(
                      builder: (context) {
                        int toplam = 0;
                        for (final controller
                            in _dailyHoursControllers.values) {
                          toplam += int.tryParse(controller.text) ?? 0;
                        }
                        return Text(
                          '$toplam saat',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Icon(
                    Icons.schedule_rounded,
                    color: Theme.of(context).primaryColor,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'Günlük Mesai (saat)',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: _getShadowColor(),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: TextFormField(
                        controller: _dailyHoursControllers['pazartesi'],
                        decoration: InputDecoration(
                          labelText: 'Pazartesi',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: Theme.of(context).primaryColor,
                              width: 2,
                            ),
                          ),
                          filled: true,
                          fillColor: _getFillColor(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: _getShadowColor(),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: TextFormField(
                        controller: _dailyHoursControllers['sali'],
                        decoration: InputDecoration(
                          labelText: 'Salı',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: Theme.of(context).primaryColor,
                              width: 2,
                            ),
                          ),
                          filled: true,
                          fillColor: _getFillColor(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: _getShadowColor(),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: TextFormField(
                        controller: _dailyHoursControllers['carsamba'],
                        decoration: InputDecoration(
                          labelText: 'Çarşamba',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: Theme.of(context).primaryColor,
                              width: 2,
                            ),
                          ),
                          filled: true,
                          fillColor: _getFillColor(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: _getShadowColor(),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: TextFormField(
                        controller: _dailyHoursControllers['persembe'],
                        decoration: InputDecoration(
                          labelText: 'Perşembe',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: Theme.of(context).primaryColor,
                              width: 2,
                            ),
                          ),
                          filled: true,
                          fillColor: _getFillColor(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: _getShadowColor(),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: TextFormField(
                        controller: _dailyHoursControllers['cuma'],
                        decoration: InputDecoration(
                          labelText: 'Cuma',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: Theme.of(context).primaryColor,
                              width: 2,
                            ),
                          ),
                          filled: true,
                          fillColor: _getFillColor(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: _getShadowColor(),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: TextFormField(
                        controller: _dailyHoursControllers['cumartesi'],
                        decoration: InputDecoration(
                          labelText: 'Cumartesi',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: Theme.of(context).primaryColor,
                              width: 2,
                            ),
                          ),
                          filled: true,
                          fillColor: _getFillColor(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: _getShadowColor(),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: TextFormField(
                        controller: _dailyHoursControllers['pazar'],
                        decoration: InputDecoration(
                          labelText: 'Pazar',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(
                              color: Theme.of(context).primaryColor,
                              width: 2,
                            ),
                          ),
                          filled: true,
                          fillColor: _getFillColor(),
                        ),
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Container()),
                ],
              ),
              const SizedBox(height: 24),
              Container(
                width: double.infinity,
                height: 56,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Theme.of(context).primaryColor,
                      Theme.of(context).primaryColor.withOpacity(0.8),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Theme.of(context).primaryColor.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: _loading
                        ? null
                        : () {
                            if (_editingEmployeeId == null) {
                              _addEmployee();
                            } else {
                              _saveEditEmployee();
                            }
                          },
                    child: Center(
                      child: _loading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  _editingEmployeeId == null
                                      ? Icons.person_add_rounded
                                      : Icons.save_rounded,
                                  color: Colors.white,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  _editingEmployeeId == null
                                      ? 'Çalışan Ekle'
                                      : 'Kaydet',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
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
