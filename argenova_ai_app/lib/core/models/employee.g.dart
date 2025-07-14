// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'employee.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Employee _$EmployeeFromJson(Map<String, dynamic> json) => Employee(
      id: (json['id'] as num?)?.toInt(),
      isim: json['isim'] as String,
      toplamMesai: (json['toplamMesai'] as num).toInt(),
      tarihAraligi: json['tarihAraligi'] as String,
      gunlukMesai: Map<String, int>.from(json['gunlukMesai'] as Map),
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$EmployeeToJson(Employee instance) => <String, dynamic>{
      'id': instance.id,
      'isim': instance.isim,
      'toplamMesai': instance.toplamMesai,
      'tarihAraligi': instance.tarihAraligi,
      'gunlukMesai': instance.gunlukMesai,
      'createdAt': instance.createdAt?.toIso8601String(),
    };

EmployeeCreate _$EmployeeCreateFromJson(Map<String, dynamic> json) =>
    EmployeeCreate(
      isim: json['isim'] as String,
      toplamMesai: (json['toplamMesai'] as num).toInt(),
      tarihAraligi: json['tarihAraligi'] as String,
      gunlukMesai: Map<String, int>.from(json['gunlukMesai'] as Map),
    );

Map<String, dynamic> _$EmployeeCreateToJson(EmployeeCreate instance) =>
    <String, dynamic>{
      'isim': instance.isim,
      'toplamMesai': instance.toplamMesai,
      'tarihAraligi': instance.tarihAraligi,
      'gunlukMesai': instance.gunlukMesai,
    };

EmployeeResponse _$EmployeeResponseFromJson(Map<String, dynamic> json) =>
    EmployeeResponse(
      success: json['success'] as bool,
      data: (json['data'] as List<dynamic>?)
          ?.map((e) => Employee.fromJson(e as Map<String, dynamic>))
          .toList(),
      count: (json['count'] as num?)?.toInt(),
      error: json['error'] as String?,
    );

Map<String, dynamic> _$EmployeeResponseToJson(EmployeeResponse instance) =>
    <String, dynamic>{
      'success': instance.success,
      'data': instance.data,
      'count': instance.count,
      'error': instance.error,
    };
