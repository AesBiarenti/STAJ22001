import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/models/chat_message.dart';
import '../../core/models/chat_session.dart';
import '../../core/theme_constants.dart';
import '../../core/widgets/custom_app_bar.dart';
import '../../core/widgets/custom_button.dart';
import '../../core/widgets/custom_card.dart';
import '../../core/widgets/custom_drawer.dart';
import '../admin/admin_screen.dart';
import '../chat/chat_screen.dart';
import 'home_viewmodel.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatSessions = ref.watch(chatSessionsProvider);
    final chatNotifier = ref.read(chatSessionsProvider.notifier);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark
        ? AppColors.darkBackground
        : AppColors.lightBackground;
    final cardColor = isDark ? AppColors.darkCard : AppColors.lightCard;
    final textColor = isDark ? AppColors.darkText : AppColors.lightText;
    final subtitleColor = isDark
        ? AppColors.darkSubtitle
        : AppColors.lightSubtitle;
    final dividerColor = isDark
        ? AppColors.darkDivider
        : AppColors.lightDivider;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: CustomAppBar(
        title: 'Sohbetler',
        actions: [
          IconButton(
            icon: const Icon(
              Icons.admin_panel_settings,
              color: Colors.grey,
              size: 28,
            ),
            onPressed: () {
              Navigator.of(
                context,
              ).push(MaterialPageRoute(builder: (_) => const AdminScreen()));
            },
          ),
        ],
      ),
      drawer: CustomDrawer(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 24, 20, 8),
              child: Text(
                'Sohbet Geçmişi',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
            ),
            Expanded(
              child: chatSessions.isEmpty
                  ? Center(
                      child: Text(
                        'Henüz sohbet yok.',
                        style: TextStyle(color: textColor),
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      itemCount: chatSessions.length,
                      separatorBuilder: (_, __) => SizedBox(
                        height: 8,
                        child: Divider(color: dividerColor),
                      ),
                      itemBuilder: (context, index) {
                        final session = chatSessions[index];
                        return CustomCard(
                          child: ListTile(
                            contentPadding: AppPaddings.card,
                            title: Text(
                              session.title,
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: textColor,
                              ),
                            ),
                            subtitle: Text(
                              session.messages.isNotEmpty
                                  ? session.messages.last.content
                                  : '',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: subtitleColor),
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(
                                    Icons.delete_outline,
                                    color: Colors.redAccent,
                                  ),
                                  tooltip: 'Sohbeti Sil',
                                  onPressed: () async {
                                    final confirm = await showDialog<bool>(
                                      context: context,
                                      builder: (ctx) => AlertDialog(
                                        title: const Text('Sohbeti Sil'),
                                        content: const Text(
                                          'Bu sohbeti silmek istediğinize emin misiniz?',
                                        ),
                                        actions: [
                                          TextButton(
                                            onPressed: () =>
                                                Navigator.of(ctx).pop(false),
                                            child: const Text('Vazgeç'),
                                          ),
                                          TextButton(
                                            onPressed: () =>
                                                Navigator.of(ctx).pop(true),
                                            child: const Text(
                                              'Sil',
                                              style: TextStyle(
                                                color: Colors.red,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    );
                                    if (confirm == true) {
                                      await chatNotifier.deleteSession(
                                        session.id,
                                      );
                                    }
                                  },
                                ),
                                const SizedBox(width: 4),
                                const Icon(
                                  Icons.chevron_right,
                                  color: Colors.grey,
                                ),
                              ],
                            ),
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => ChatScreen(session: session),
                                ),
                              );
                            },
                          ),
                        );
                      },
                    ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
              child: CustomButton(
                label: 'Yeni Sohbet Başlat',
                icon: Icons.add,
                onTap: () {
                  final newSession = ChatSession(
                    id: DateTime.now().millisecondsSinceEpoch.toString(),
                    title: 'Yeni Sohbet',
                    createdAt: DateTime.now(),
                    messages: [
                      ChatMessage(
                        id: DateTime.now().millisecondsSinceEpoch.toString(),
                        content: 'Yeni sohbet başlatıldı.',
                        sender: MessageSender.ai,
                        createdAt: DateTime.now(),
                      ),
                    ],
                  );
                  chatNotifier.addSession(newSession);
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ChatScreen(session: newSession),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
      body: Center(
        child: Padding(
          padding: AppPaddings.page,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Icon(Icons.chat_bubble_outline, size: 64, color: subtitleColor),
              const SizedBox(height: 24),
              Text(
                'Hoş geldiniz! Yeni bir sohbet başlatın veya geçmiş sohbetlerinize göz atın.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 18, color: textColor),
              ),
              const SizedBox(height: 32),
              CustomButton(
                label: 'Yeni Sohbet',
                icon: Icons.add,
                onTap: () {
                  final newSession = ChatSession(
                    id: DateTime.now().millisecondsSinceEpoch.toString(),
                    title: 'Yeni Sohbet',
                    createdAt: DateTime.now(),
                    messages: [
                      ChatMessage(
                        id: DateTime.now().millisecondsSinceEpoch.toString(),
                        content: 'Yeni sohbet başlatıldı.',
                        sender: MessageSender.ai,
                        createdAt: DateTime.now(),
                      ),
                    ],
                  );
                  chatNotifier.addSession(newSession);
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => ChatScreen(session: newSession),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
