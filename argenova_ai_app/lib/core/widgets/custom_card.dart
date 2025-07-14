import 'package:flutter/material.dart';

import '../theme_constants.dart';

class CustomCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  const CustomCard({required this.child, this.padding, this.onTap, super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = isDark ? AppColors.darkCard : AppColors.lightCard;
    return Material(
      color: color,
      borderRadius: AppRadius.card,
      child: InkWell(
        borderRadius: AppRadius.card,
        onTap: onTap,
        child: Padding(padding: padding ?? AppPaddings.card, child: child),
      ),
    );
  }
}
