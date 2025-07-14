import 'package:flutter/material.dart';

import '../theme_constants.dart';

class CustomDrawer extends StatelessWidget {
  final Widget child;
  const CustomDrawer({required this.child, super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    return Drawer(
      backgroundColor: bgColor,
      child: SafeArea(child: child),
    );
  }
}
