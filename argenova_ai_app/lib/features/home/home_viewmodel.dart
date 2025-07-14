import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive/hive.dart';

import '../../core/models/chat_message.dart';
import '../../core/models/chat_session.dart';

final chatSessionsProvider =
    StateNotifierProvider<ChatSessionsNotifier, List<ChatSession>>((ref) {
      return ChatSessionsNotifier();
    });

class ChatSessionsNotifier extends StateNotifier<List<ChatSession>> {
  static const String boxName = 'chat_sessions';
  late Box<ChatSession> _box;

  ChatSessionsNotifier() : super([]) {
    _init();
  }

  Future<void> _init() async {
    _box = await Hive.openBox<ChatSession>(boxName);
    state = _box.values.toList().reversed.toList();
  }

  Future<void> addSession(ChatSession session) async {
    await _box.put(session.id, session);
    state = _box.values.toList().reversed.toList();
  }

  Future<void> updateSession(ChatSession session) async {
    // İlk kullanıcı mesajını özet olarak başlığa ata
    if (session.title == 'Yeni Sohbet' && session.messages.length > 1) {
      final firstUserMessage = session.messages.firstWhere(
        (msg) => msg.sender == MessageSender.user,
        orElse: () => session.messages.first,
      );

      // Başlık olarak kullanılacak özeti oluştur
      final updatedTitle = _createTitleFromMessage(firstUserMessage.content);

      // Yeni başlıklı session oluştur
      final updatedSession = ChatSession(
        id: session.id,
        title: updatedTitle,
        messages: session.messages,
        createdAt: session.createdAt,
      );

      // Güncellenen session'ı kaydet
      await _box.put(updatedSession.id, updatedSession);
      state = _box.values.toList().reversed.toList();
      return;
    }

    await _box.put(session.id, session);
    state = _box.values.toList().reversed.toList();
  }

  Future<void> deleteSession(String id) async {
    await _box.delete(id);
    state = _box.values.toList().reversed.toList();
  }

  // Mesaj içeriğinden kısa bir başlık oluşturur
  String _createTitleFromMessage(String message) {
    // Mesajı temizle ve kısalt
    final cleanMessage = message.trim();

    // Eğer mesaj zaten kısa ise, direkt döndür
    if (cleanMessage.length <= 40) {
      return cleanMessage;
    }

    // Mesajı ilk 37 karaktere kısalt ve "..." ekle
    return '${cleanMessage.substring(0, 37)}...';
  }
}
