import 'package:json_annotation/json_annotation.dart';

part 'employee.g.dart';

@JsonSerializable()
class Employee {
  final int? id;
  final String isim;
  final int toplamMesai;
  final String tarihAraligi;
  final Map<String, int> gunlukMesai;
  final DateTime? createdAt;

  Employee({
    this.id,
    required this.isim,
    required this.toplamMesai,
    required this.tarihAraligi,
    required this.gunlukMesai,
    this.createdAt,
  });

  factory Employee.fromJson(Map<String, dynamic> json) =>
      _$EmployeeFromJson(json);
  Map<String, dynamic> toJson() => _$EmployeeToJson(this);
}

@JsonSerializable()
class EmployeeCreate {
  final String isim;
  final int toplamMesai;
  final String tarihAraligi;
  final Map<String, int> gunlukMesai;

  EmployeeCreate({
    required this.isim,
    required this.toplamMesai,
    required this.tarihAraligi,
    required this.gunlukMesai,
  });

  factory EmployeeCreate.fromJson(Map<String, dynamic> json) =>
      _$EmployeeCreateFromJson(json);
  Map<String, dynamic> toJson() => _$EmployeeCreateToJson(this);
}

@JsonSerializable()
class EmployeeResponse {
  final bool success;
  final List<Employee>? data;
  final int? count;
  final String? error;

  EmployeeResponse({required this.success, this.data, this.count, this.error});

  factory EmployeeResponse.fromJson(Map<String, dynamic> json) =>
      _$EmployeeResponseFromJson(json);
  Map<String, dynamic> toJson() => _$EmployeeResponseToJson(this);
}
