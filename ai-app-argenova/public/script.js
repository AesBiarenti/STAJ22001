// Vue.js 3 Uygulaması
const { createApp } = Vue;

createApp({
    data() {
        return {
            // Chat verileri
            messages: [
                {
                    sender: "bot",
                    content:
                        "Merhaba! Ben AI Asistanınız. Size nasıl yardımcı olabilirim?",
                },
            ],
            newMessage: "",
            sending: false,
            loading: false,

            // Model seçimi
            selectedModel: "llama3.2:7b",

            // Tab sistemi
            activeTab: "history",

            // Geçmiş sorgular
            history: [],
            loadingHistory: false,

            // Vektör veritabanı
            vectors: [],
            loadingVectors: false,
            loadingTraining: false,
            clearingVectors: false,

            // Mobil sidebar
            sidebarOpen: false,
        };
    },

    mounted() {
        this.loadHistory();
        this.loadVectors();
        this.loadSavedModel();
    },

    methods: {
        // Mesaj gönderme
        async sendMessage() {
            if (!this.newMessage.trim() || this.sending) return;

            const userMessage = this.newMessage.trim();
            this.messages.push({
                sender: "user",
                content: this.escapeHTML(userMessage),
            });

            this.newMessage = "";
            this.sending = true;
            this.loading = true;

            try {
                const response = await fetch("/api/query", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: userMessage,
                        model: this.selectedModel,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Sunucu hatası");
                }

                const data = await response.json();
                this.messages.push({
                    sender: "bot",
                    content: this.escapeHTML(data.reply || "Yanıt alınamadı."),
                });

                this.loadHistory(); // Geçmişi güncelle
            } catch (error) {
                this.messages.push({
                    sender: "bot",
                    content: `Hata: ${error.message}`,
                });
            } finally {
                this.sending = false;
                this.loading = false;
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            }
        },

        // Yeni sohbet başlat
        startNewChat() {
            this.messages = [
                {
                    sender: "bot",
                    content:
                        "Merhaba! Ben AI Asistanınız. Size nasıl yardımcı olabilirim?",
                },
            ];
        },

        // Geçmiş sohbet yükle
        loadHistoryChat(log) {
            this.messages = [
                {
                    sender: "bot",
                    content:
                        "<strong>Geçmiş Sorgu Yüklendi</strong><br>Bu geçmiş sorguyu inceleyebilir veya yeni bir soru sorabilirsiniz.",
                },
                {
                    sender: "user",
                    content: this.escapeHTML(log.prompt),
                },
                {
                    sender: "bot",
                    content: this.escapeHTML(log.response),
                },
            ];
        },

        // Tab değiştirme
        switchTab(tabName) {
            this.activeTab = tabName;
        },

        // Model değişikliği
        handleModelChange() {
            localStorage.setItem("selectedModel", this.selectedModel);
            this.showNotification(
                `Model değiştirildi: ${this.selectedModel}`,
                "info"
            );
        },

        // Geçmiş sorguları yükle
        async loadHistory() {
            this.loadingHistory = true;
            try {
                const response = await fetch("/api/history");
                if (!response.ok) {
                    throw new Error("Geçmiş yüklenemedi");
                }
                const data = await response.json();
                this.history = data.logs || [];
            } catch (error) {
                console.error("Geçmiş yüklenemedi:", error);
            } finally {
                this.loadingHistory = false;
            }
        },

        // Vektörleri yükle
        async loadVectors() {
            this.loadingVectors = true;
            try {
                const response = await fetch("/api/vectors/list");
                if (!response.ok) {
                    throw new Error("Vektörler yüklenemedi");
                }
                const data = await response.json();
                this.vectors = data.vectors || [];
            } catch (error) {
                console.error("Vektörler yüklenemedi:", error);
            } finally {
                this.loadingVectors = false;
            }
        },

        // Eğitim örneklerini yükle
        async loadTrainingExamples() {
            this.loadingTraining = true;
            try {
                const response = await fetch(
                    "/api/populate-training-examples",
                    {
                        method: "POST",
                    }
                );

                if (!response.ok) {
                    throw new Error("Eğitim örnekleri yüklenemedi");
                }

                const data = await response.json();
                this.showNotification(
                    `${
                        data.addedCount || data.count || 0
                    } eğitim örneği yüklendi`,
                    "success"
                );
                this.loadVectors();
            } catch (error) {
                this.showNotification(`Hata: ${error.message}`, "error");
            } finally {
                this.loadingTraining = false;
            }
        },

        // Vektörleri temizle
        async clearVectors() {
            if (
                !confirm("Tüm vektörleri silmek istediğinizden emin misiniz?")
            ) {
                return;
            }

            this.clearingVectors = true;
            try {
                const response = await fetch("/api/vectors/clear", {
                    method: "DELETE",
                });

                if (!response.ok) {
                    throw new Error("Vektörler temizlenemedi");
                }

                this.showNotification("Vektörler temizlendi", "success");
                this.loadVectors();
            } catch (error) {
                this.showNotification(`Hata: ${error.message}`, "error");
            } finally {
                this.clearingVectors = false;
            }
        },

        // Kaydedilmiş modeli yükle
        loadSavedModel() {
            const savedModel = localStorage.getItem("selectedModel");
            if (savedModel) {
                this.selectedModel = savedModel;
            }
        },

        // Otomatik boyutlandırma
        autoResize(event) {
            const textarea = event.target;
            textarea.style.height = "auto";
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
        },

        // Enter ile gönderme
        handleKeyDown(event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (this.newMessage.trim() && !this.sending) {
                    this.sendMessage();
                }
            }
        },

        // Sona kaydır
        scrollToBottom() {
            if (this.$refs.chatMessages) {
                this.$refs.chatMessages.scrollTop =
                    this.$refs.chatMessages.scrollHeight;
            }
        },

        // HTML injection önlemi
        escapeHTML(str) {
            return str.replace(/[&<>'"]/g, function (tag) {
                const charsToReplace = {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    "'": "&#39;",
                    '"': "&quot;",
                };
                return charsToReplace[tag] || tag;
            });
        },

        // Metin kısaltma
        truncateText(text, maxLength) {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + "...";
        },

        // Tarih formatla
        formatDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffInHours = (now - date) / (1000 * 60 * 60);

            if (diffInHours < 24) {
                if (diffInHours < 1) {
                    const diffInMinutes = Math.floor(
                        (now - date) / (1000 * 60)
                    );
                    return `${diffInMinutes} dakika önce`;
                }
                return `${Math.floor(diffInHours)} saat önce`;
            } else if (diffInHours < 48) {
                return "Dün";
            } else {
                return date.toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                });
            }
        },

        // Bildirim göster
        showNotification(message, type = "info") {
            const notification = document.createElement("div");
            notification.className = `notification ${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${
                    type === "success"
                        ? "#28a745"
                        : type === "error"
                        ? "#dc3545"
                        : "#17a2b8"
                };
                color: white;
                padding: 1rem;
                border-radius: 8px;
                z-index: 1000;
                animation: slideIn 0.3s;
            `;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        },
    },

    watch: {
        // Mesajlar değiştiğinde otomatik kaydır
        messages: {
            handler() {
                this.$nextTick(() => {
                    this.scrollToBottom();
                });
            },
            deep: true,
        },
    },
}).mount("#app");
