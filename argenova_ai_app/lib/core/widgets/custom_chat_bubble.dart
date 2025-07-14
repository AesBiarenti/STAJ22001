import 'package:flutter/material.dart';

import '../theme_constants.dart';

class CustomChatBubble extends StatelessWidget {
  final String text;
  final bool isUser;
  final bool isLoading;
  const CustomChatBubble({
    required this.text,
    required this.isUser,
    this.isLoading = false,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isUser
        ? (isDark ? AppColors.darkPrimary : AppColors.lightPrimary)
        : (isDark ? AppColors.darkCard : AppColors.lightCard);
    final textColor = isUser
        ? Colors.white
        : (isDark ? AppColors.darkText : AppColors.lightText);
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: AppPaddings.chatBubble,
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: isUser ? AppRadius.chatBubble : AppRadius.card,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: isLoading
          ? Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: textColor,
                  ),
                ),
                const SizedBox(width: 10),
                Text('Yazıyor...', style: TextStyle(color: textColor)),
              ],
            )
          : Text(text, style: TextStyle(color: textColor, fontSize: 16)),
    );
  }
}
