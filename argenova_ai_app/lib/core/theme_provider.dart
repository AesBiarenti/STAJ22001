import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'theme_constants.dart';

final themeProvider = Provider<ThemeMode>((ref) {
  // Sistem temasını kullan
  return ThemeMode.system;
});

final appThemeDataProvider = Provider<AppThemeData>((ref) {
  return AppThemeData();
});

class AppThemeData {
  ThemeData get light => ThemeData(
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.lightAccent,
      brightness: Brightness.light,
    ),
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.lightBackground,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.lightAppBar,
      foregroundColor: AppColors.lightText,
      elevation: 0.5,
      iconTheme: IconThemeData(color: Colors.grey),
    ),
    cardColor: AppColors.lightCard,
    drawerTheme: const DrawerThemeData(backgroundColor: AppColors.lightCard),
    textTheme: const TextTheme(
      bodyLarge: TextStyle(color: AppColors.lightText),
      bodyMedium: TextStyle(color: AppColors.lightText),
      bodySmall: TextStyle(color: AppColors.lightSubtitle),
    ),
    dividerColor: AppColors.lightDivider,
  );

  ThemeData get dark => ThemeData(
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.darkAccent,
      brightness: Brightness.dark,
    ),
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.darkBackground,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.darkAppBar,
      foregroundColor: AppColors.darkText,
      elevation: 0.5,
      iconTheme: IconThemeData(color: Colors.grey),
    ),
    cardColor: AppColors.darkCard,
    drawerTheme: const DrawerThemeData(
      backgroundColor: AppColors.darkBackground,
    ),
    textTheme: const TextTheme(
      bodyLarge: TextStyle(color: AppColors.darkText),
      bodyMedium: TextStyle(color: AppColors.darkText),
      bodySmall: TextStyle(color: AppColors.darkSubtitle),
    ),
    dividerColor: AppColors.darkDivider,
  );
}
