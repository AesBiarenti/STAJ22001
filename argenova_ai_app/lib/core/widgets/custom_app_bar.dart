import 'package:flutter/material.dart';

import '../theme_constants.dart';

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final Widget? leading;
  const CustomAppBar({
    required this.title,
    this.actions,
    this.leading,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.darkAppBar : AppColors.lightAppBar;
    final textColor = isDark ? AppColors.darkText : AppColors.lightText;
    return AppBar(
      backgroundColor: bgColor,
      elevation: 0.5,
      title: Text(
        title,
        style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
      ),
      centerTitle: false,
      actions: actions,
      leading: leading,
      iconTheme: const IconThemeData(color: Colors.grey),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(56);
}
