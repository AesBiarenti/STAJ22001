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

            // Model seçimi
            selectedModel: "llama3.2:7b",

            // Tab sistemi
            activeTab: "history",

            // Geçmiş sorgular
            history: [],
            loadingHistory: false,

            // Mobil sidebar
            sidebarOpen: false,

            selectedStyle: "detaylı ve anlaşılır",
            selectedLength: "detaylı",
            feedbackGivenIndexes: [], // Hangi mesajlara feedback verildi
            selectedFile: null,
            uploading: false,
            uploadStatus: null,
            employeeStats: null,
        };
    },

    mounted() {
        this.loadHistory();
        this.loadSavedModel();
        this.loadEmployeeStats();
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

            try {
                // Normal AI chat kullan
                const response = await fetch("/api/chat", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        prompt: userMessage,
                        model: this.selectedModel,
                        style: this.selectedStyle,
                        length: this.selectedLength,
                    }),
                });

                const data = await response.json();

                if (data.success) {
                    this.messages.push({
                        sender: "bot",
                        content: this.escapeHTML(data.response),
                        meta: {
                            duration: data.duration || 0,
                            logId: data.logId,
                            similarExamples: data.similarExamples || [],
                            selfCheck: data.selfCheck || null,
                        },
                    });
                } else {
                    throw new Error(data.error || "Yanıt alınamadı");
                }
            } catch (error) {
                console.error("Mesaj gönderme hatası:", error);
                this.messages.push({
                    sender: "bot",
                    content: `Hata: ${error.message}`,
                    meta: { error: true },
                });
            } finally {
                this.sending = false;
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
            // Log modelindeki messages array'inden user ve bot mesajlarını al
            const userMessage = log.messages.find(
                (msg) => msg.sender === "user"
            );
            const botMessage = log.messages.find((msg) => msg.sender === "bot");

            this.messages = [
                {
                    sender: "bot",
                    content:
                        "<strong>Geçmiş Sorgu Yüklendi</strong><br>Bu geçmiş sorguyu inceleyebilir veya yeni bir soru sorabilirsiniz.",
                },
                {
                    sender: "user",
                    content: this.escapeHTML(
                        userMessage ? userMessage.content : "Mesaj bulunamadı"
                    ),
                },
                {
                    sender: "bot",
                    content: this.escapeHTML(
                        botMessage ? botMessage.content : "Yanıt bulunamadı"
                    ),
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

        // Çalışan verileri yönetimi
        triggerFileUpload() {
            this.$refs.fileInput.click();
        },

        handleFileSelect(event) {
            const file = event.target.files[0];
            if (file) {
                this.selectedFile = file;
                this.uploadStatus = null;
            }
        },

        handleFileDrop(event) {
            event.preventDefault();
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (
                    file.type.includes("spreadsheet") ||
                    file.name.endsWith(".xlsx") ||
                    file.name.endsWith(".xls")
                ) {
                    this.selectedFile = file;
                    this.uploadStatus = null;
                } else {
                    this.showNotification(
                        "Sadece Excel dosyaları desteklenir",
                        "error"
                    );
                }
            }
        },

        async uploadEmployeeData() {
            if (!this.selectedFile) {
                this.showNotification("Lütfen bir dosya seçin", "error");
                return;
            }

            this.uploading = true;
            this.uploadStatus = null;

            const formData = new FormData();
            formData.append("file", this.selectedFile);

            try {
                const response = await fetch("/api/upload-employees", {
                    method: "POST",
                    body: formData,
                });

                const data = await response.json();

                if (data.success) {
                    this.uploadStatus = {
                        type: "success",
                        message: `Veriler başarıyla yüklendi! ${data.totalEmployees} çalışan, ${data.totalRecords} kayıt işlendi.`,
                    };
                    this.selectedFile = null;
                    this.$refs.fileInput.value = "";
                    this.loadEmployeeStats();
                    this.showNotification(
                        "Çalışan verileri başarıyla yüklendi",
                        "success"
                    );
                } else {
                    this.uploadStatus = {
                        type: "error",
                        message: data.error || "Veri yükleme hatası",
                    };
                    this.showNotification(
                        data.error || "Veri yükleme hatası",
                        "error"
                    );
                }
            } catch (error) {
                console.error("Dosya yükleme hatası:", error);
                this.uploadStatus = {
                    type: "error",
                    message: "Dosya yükleme sırasında hata oluştu",
                };
                this.showNotification("Dosya yükleme hatası", "error");
            } finally {
                this.uploading = false;
            }
        },

        async loadEmployeeStats() {
            try {
                const response = await fetch("/api/employee-stats");
                const data = await response.json();
                if (data.success) {
                    this.employeeStats = data.stats;
                }
            } catch (error) {
                console.error("İstatistik yükleme hatası:", error);
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
        truncateText(str, maxLength) {
            if (!str) return "";
            return str.length > maxLength
                ? str.slice(0, maxLength) + "..."
                : str;
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

// Dinamik çalışan sıralama ve analiz fonksiyonu
function analyzeEmployees(data) {
    // Toplam mesaiye göre azdan çoğa sırala
    const sirali = [...data].sort((a, b) => a.toplam_mesai - b.toplam_mesai);
    console.log("Azdan çoğa çalışanlar:");
    sirali.forEach((w, i) => {
        console.log(
            `${i + 1}. ${w.isim} - Toplam Mesai: ${w.toplam_mesai} saat`
        );
    });
    // En az mesai yapan
    const enAzMesaiYapan = sirali[0];
    console.log(
        `\nEn az mesai yapan: ${enAzMesaiYapan.isim} (${enAzMesaiYapan.toplam_mesai} saat)`
    );
    // Her çalışanın en az mesai yaptığı günü bul
    sirali.forEach((worker) => {
        const minGun = Math.min(...worker.gunluk_mesai_saatleri);
        const minGunIndex = worker.gunluk_mesai_saatleri.indexOf(minGun) + 1;
        console.log(
            `${worker.isim} en az mesai yaptığı gün: ${minGun} saat (Gün: ${minGunIndex})`
        );
    });
}

// Örnek kullanım (data dışarıdan gelebilir)
// analyzeEmployees(data);
// data: API'den, dosyadan veya kullanıcıdan alınan çalışan verileri olmalı
