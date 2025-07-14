import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/ollama_service.dart';
import '../../core/api/qdrant_service.dart';
import '../../core/models/chat_message.dart';
import '../../core/models/chat_session.dart';
import '../../core/widgets/custom_app_bar.dart';
import '../../core/widgets/custom_button.dart';
import '../../core/widgets/custom_chat_bubble.dart';
import '../home/home_viewmodel.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final ChatSession session;
  const ChatScreen({super.key, required this.session});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  late List<ChatMessage> _messages;
  bool _loading = false;
  String? _error;
  late AnimationController _dotsController;
  StreamSubscription<String>? _streamSubscription;

  @override
  void initState() {
    super.initState();
    _messages = List.from(widget.session.messages);
    _dotsController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();
    _controller.addListener(_onTextChanged);
  }

  void _onTextChanged() {
    setState(() {});
  }

  @override
  void dispose() {
    _controller.removeListener(_onTextChanged);
    _controller.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    _dotsController.dispose();
    _streamSubscription?.cancel();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _loading) return;
    setState(() {
      _messages.add(
        ChatMessage(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          content: text,
          sender: MessageSender.user,
          createdAt: DateTime.now(),
        ),
      );
      _controller.clear();
      _loading = true;
      _error = null;
    });
    _scrollToBottom();
    try {
      final ollama = OllamaService();
      final qdrant = QdrantService();

      // Basitleştirilmiş context alma
      final embedding = await ollama.getEmbedding(text);
      final context = await qdrant.getSmartContext(embedding, text);

      // Context debug bilgisi
      print('🔍 Context alındı: ${context.length} çalışan');
      for (final item in context) {
        print('  - ${item['isim']}: ${item['toplam_mesai']} saat');
      }
      setState(() {
        _messages.add(
          ChatMessage(
            id: 'ai_loading',
            content: 'Yanıt hazırlanıyor...',
            sender: MessageSender.ai,
            createdAt: DateTime.now(),
          ),
        );
      });
      _scrollToBottom();
      // Sohbet geçmişini hazırla (son 6 mesaj - 3 kullanıcı, 3 AI)
      final recentMessages = _messages
          .take(_messages.length - 1) // Son eklenen mesajı hariç tut
          .toList();

      // Son 6 mesajı al (3 kullanıcı + 3 AI mesajı)
      final chatHistory = recentMessages.reversed
          .take(6)
          .toList()
          .reversed
          .map(
            (msg) => {
              'role': msg.sender == MessageSender.user ? 'Kullanıcı' : 'AI',
              'content': msg.content,
            },
          )
          .toList();

      // Stream yanıtı başlat
      StringBuffer streamedAnswer = StringBuffer();
      final aiMessageId = DateTime.now().millisecondsSinceEpoch.toString();

      setState(() {
        _messages.removeWhere((m) => m.id == 'ai_loading');
        _messages.add(
          ChatMessage(
            id: aiMessageId,
            content: 'Yazıyor...',
            sender: MessageSender.ai,
            createdAt: DateTime.now(),
          ),
        );
      });
      _scrollToBottom();

      _streamSubscription = ollama
          .streamGenerateAnswer(text, context, chatHistory: chatHistory)
          .listen(
            (chunk) {
              streamedAnswer.write(chunk);
              setState(() {
                final messageIndex = _messages.indexWhere(
                  (m) => m.id == aiMessageId,
                );
                if (messageIndex != -1) {
                  // İlk kelime geldiğinde "Yazıyor..." metnini kaldır
                  String content = streamedAnswer.toString();
                  if (content.startsWith('Yazıyor...')) {
                    content = content.substring('Yazıyor...'.length);
                  }

                  _messages[messageIndex] = ChatMessage(
                    id: aiMessageId,
                    content: content,
                    sender: MessageSender.ai,
                    createdAt: _messages[messageIndex].createdAt,
                  );
                }
              });
              _scrollToBottom();
            },
            onError: (error) {
              setState(() {
                _loading = false;
                _error = error.toString();
                _messages.removeWhere((m) => m.id == aiMessageId);
              });
              _scrollToBottom();
            },
            onDone: () async {
              setState(() {
                _loading = false;
              });

              // Sohbet başlığını güncelle - sadece 'Yeni Sohbet' başlıklı sohbetler için
              String updatedTitle = widget.session.title;
              if (updatedTitle == 'Yeni Sohbet') {
                // Kullanıcının ilk mesajını bul
                final userMessages = _messages
                    .where((m) => m.sender == MessageSender.user)
                    .toList();
                if (userMessages.isNotEmpty) {
                  final firstUserMessage = userMessages.first.content;
                  // Başlığı kısalt
                  if (firstUserMessage.length <= 40) {
                    updatedTitle = firstUserMessage;
                  } else {
                    updatedTitle = '${firstUserMessage.substring(0, 37)}...';
                  }
                }
              }

              final updatedSession = ChatSession(
                id: widget.session.id,
                title: updatedTitle,
                createdAt: widget.session.createdAt,
                messages: List.from(_messages),
              );
              await ref
                  .read(chatSessionsProvider.notifier)
                  .updateSession(updatedSession);
              _focusNode.requestFocus();
            },
          );
    } catch (e) {
      setState(() {
        _loading = false;
        _error = e.toString();
        _messages.removeWhere((m) => m.id == 'ai_loading');
      });
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Widget _buildDots() {
    return AnimatedBuilder(
      animation: _dotsController,
      builder: (context, child) {
        int tick = (_dotsController.value * 3).floor();
        String dots = '.' * ((tick % 3) + 1);
        return Text('Yazıyor$dots', style: const TextStyle(color: Colors.grey));
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF23272A) : const Color(0xFFF7F7F8);
    return Scaffold(
      backgroundColor: bgColor,
      appBar: CustomAppBar(
        title: widget.session.title,
        actions: [
          IconButton(
            icon: const Icon(
              Icons.account_circle,
              color: Colors.grey,
              size: 28,
            ),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.separated(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 20),
              itemCount: _messages.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg.sender == MessageSender.user;
                final isLoading = msg.id == 'ai_loading';
                return Row(
                  mainAxisAlignment: isUser
                      ? MainAxisAlignment.end
                      : MainAxisAlignment.start,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!isUser)
                      Padding(
                        padding: const EdgeInsets.only(right: 6, top: 2),
                        child: CircleAvatar(
                          radius: 16,
                          backgroundColor: Colors.grey[300],
                          child: const Icon(
                            Icons.smart_toy,
                            color: Colors.black54,
                            size: 18,
                          ),
                        ),
                      ),
                    Flexible(
                      child: CustomChatBubble(
                        text: msg.content,
                        isUser: isUser,
                        isLoading: isLoading,
                      ),
                    ),
                    if (isUser) const SizedBox(width: 6),
                    if (isUser)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: CircleAvatar(
                          radius: 16,
                          backgroundColor: Colors.blue[100],
                          child: const Icon(
                            Icons.person,
                            color: Colors.blue,
                            size: 18,
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
          if (_error != null)
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Text(_error!, style: const TextStyle(color: Colors.red)),
            ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF2C2F33) : Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 2,
                            offset: const Offset(0, 1),
                          ),
                        ],
                      ),
                      child: TextField(
                        controller: _controller,
                        focusNode: _focusNode,
                        decoration: const InputDecoration(
                          hintText: 'Mesajınızı yazın...',
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 18,
                            vertical: 14,
                          ),
                        ),
                        onSubmitted: (_) => _sendMessage(),
                        enabled: !_loading,
                        minLines: 1,
                        maxLines: 5,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CustomButton(
                    label: '',
                    icon: Icons.send,
                    isPrimary: true,
                    onTap: _loading || _controller.text.trim().isEmpty
                        ? () {}
                        : _sendMessage,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
