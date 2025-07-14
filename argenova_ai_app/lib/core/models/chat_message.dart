import 'package:hive/hive.dart';

part 'chat_message.g.dart';

@HiveType(typeId: 1)
enum MessageSender {
  @HiveField(0)
  user,
  @HiveField(1)
  ai,
}

@HiveType(typeId: 2)
class ChatMessage {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final String content;
  @HiveField(2)
  final MessageSender sender;
  @HiveField(3)
  final DateTime createdAt;

  ChatMessage({
    required this.id,
    required this.content,
    required this.sender,
    required this.createdAt,
  });
}
