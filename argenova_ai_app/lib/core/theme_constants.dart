import 'package:flutter/material.dart';

class AppColors {
  // Light Theme Colors
  static const Color lightBackground = Color(0xFFF7F7F8);
  static const Color lightCard = Colors.white;
  static const Color lightAppBar = Colors.white;
  static const Color lightPrimary = Color(0xFF007AFF);
  static const Color lightAccent = Colors.deepPurple;
  static const Color lightText = Colors.black87;
  static const Color lightSubtitle = Colors.grey;
  static const Color lightDivider = Color(0xFFE0E0E0);

  // Dark Theme Colors
  static const Color darkBackground = Color(0xFF23272A);
  static const Color darkCard = Color(0xFF2C2F33);
  static const Color darkAppBar = Color(0xFF2C2F33);
  static const Color darkPrimary = Color(0xFF7289DA);
  static const Color darkAccent = Colors.deepPurpleAccent;
  static const Color darkText = Colors.white;
  static const Color darkSubtitle = Colors.grey;
  static const Color darkDivider = Color(0xFF44474A);
}

class AppRadius {
  static const BorderRadius card = BorderRadius.all(Radius.circular(14));
  static const BorderRadius chatBubble = BorderRadius.only(
    topLeft: Radius.circular(18),
    topRight: Radius.circular(18),
    bottomLeft: Radius.circular(18),
    bottomRight: Radius.circular(4),
  );
}

class AppPaddings {
  static const EdgeInsets page = EdgeInsets.symmetric(
    horizontal: 16,
    vertical: 12,
  );
  static const EdgeInsets card = EdgeInsets.symmetric(
    horizontal: 16,
    vertical: 8,
  );
  static const EdgeInsets chatBubble = EdgeInsets.symmetric(
    horizontal: 14,
    vertical: 12,
  );
}
