const queryForm = document.getElementById("queryForm");
const promptInput = document.getElementById("prompt");
const submitBtn = document.getElementById("submitBtn");
const responseContainer = document.getElementById("responseContainer");
const responseEl = document.getElementById("response");
const responseTime = document.getElementById("responseTime");
const historyContainer = document.getElementById("history");
const refreshHistoryBtn = document.getElementById("refreshHistory");
const loadingOverlay = document.getElementById("loadingOverlay");
const vectorList = document.getElementById("vectorList");
const refreshVectorsBtn = document.getElementById("refreshVectors");
const clearVectorsBtn = document.getElementById("clearVectors");
const loadTrainingExamplesBtn = document.getElementById("loadTrainingExamples");

queryForm.addEventListener("submit", handleSubmit);
refreshHistoryBtn.addEventListener("click", loadHistory);
if (refreshVectorsBtn) refreshVectorsBtn.addEventListener("click", loadVectors);
if (clearVectorsBtn) clearVectorsBtn.addEventListener("click", clearVectors);
if (loadTrainingExamplesBtn)
    loadTrainingExamplesBtn.addEventListener("click", loadTrainingExamples);

async function handleSubmit(e) {
    e.preventDefault();

    const prompt = promptInput.value.trim();
    if (!prompt) {
        showError("Lütfen haftalık çalışma verilerini girin.");
        return;
    }

    setLoadingState(true);
    showLoadingOverlay();

    try {
        const response = await fetch("/api/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Sunucu hatası");
        }

        const data = await response.json();
        showResponse(data);
        loadHistory();
    } catch (error) {
        showError(`Hata: ${error.message}`);
    } finally {
        setLoadingState(false);
        hideLoadingOverlay();
    }
}

function showResponse(data) {
    const duration = data.duration ?? 0;
    const reply = data.reply || "Yanıt alınamadı.";

    responseEl.textContent = reply;
    responseTime.textContent = `${duration.toFixed(2)} saniye`;

    responseContainer.style.display = "block";
    responseContainer.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
    });
}

function showError(message) {
    responseEl.textContent = message;
    responseTime.textContent = "";
    responseContainer.style.display = "block";
}

function setLoadingState(isLoading) {
    submitBtn.disabled = isLoading;
    const btnText = submitBtn.querySelector("span");
    const btnIcon = submitBtn.querySelector("i");

    if (isLoading) {
        btnText.textContent = "Analiz Ediliyor...";
        btnIcon.className = "fas fa-spinner fa-spin";
    } else {
        btnText.textContent = "Analiz Et";
        btnIcon.className = "fas fa-paper-plane";
    }
}

function showLoadingOverlay() {
    loadingOverlay.style.display = "flex";
}

function hideLoadingOverlay() {
    loadingOverlay.style.display = "none";
}

async function loadHistory() {
    try {
        historyContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Geçmiş yükleniyor...</span>
            </div>
        `;

        const response = await fetch("/api/history");
        if (!response.ok) {
            throw new Error("Geçmiş yüklenemedi");
        }

        const data = await response.json();
        renderHistory(data.logs || []);
    } catch (error) {
        console.error("Geçmiş yüklenemedi:", error);
        historyContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Geçmiş yüklenirken hata oluştu: ${error.message}</span>
            </div>
        `;
    }
}

function renderHistory(logs) {
    if (logs.length === 0) {
        historyContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-inbox"></i>
                <span>Henüz sorgu bulunmuyor</span>
            </div>
        `;
        return;
    }

    historyContainer.innerHTML = logs
        .map(
            (entry, index) => `
        <div class="history-item" data-index="${index}">
            <div class="history-header">
                <div class="history-prompt">${truncateText(
                    entry.prompt,
                    100
                )}</div>
                <div class="history-meta">
                    <span>
                        <i class="fas fa-clock"></i>
                        ${entry.duration.toFixed(2)}s
                    </span>
                    <span>
                        <i class="fas fa-calendar"></i>
                        ${formatDate(entry.createdAt)}
                    </span>
                </div>
            </div>
            <div class="history-response">
                ${entry.response}
            </div>
        </div>
    `
        )
        .join("");

    document.querySelectorAll(".history-item").forEach((item) => {
        item.addEventListener("click", () => {
            item.classList.toggle("expanded");
        });
    });
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
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
}

function initApp() {
    loadHistory();
    loadVectors();

    promptInput.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";
    });

    promptInput.addEventListener("focus", function () {
        if (!this.value.trim()) {
            this.placeholder = `Örnek:
Sen bir Türkçe asistanısın. Mesai saatlerimiz öğle arası 12.00 - 13.00. Haftalık çalışma verilerini yorumla:
Pazartesi: 08:45–17:10
Salı: 09:15–17:00
Çarşamba: 08:30–17:30
Perşembe: 09:00–17:15
Cuma: 08:00–16:45`;
        }
    });
}

document.addEventListener("DOMContentLoaded", initApp);

async function loadVectors() {
    try {
        vectorList.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> <span>Vektörler yükleniyor...</span></div>`;
        const res = await fetch("/api/vectors/list");
        if (!res.ok) throw new Error("Vektörler yüklenemedi");
        const data = await res.json();
        if (!data.vectors || data.vectors.length === 0) {
            vectorList.innerHTML = `<div class="loading"><i class="fas fa-inbox"></i> <span>Vektör bulunamadı</span></div>`;
            return;
        }
        vectorList.innerHTML = data.vectors
            .map(
                (v, i) => `
            <div class="vector-item">
                <div class="vector-meta">
                    <b>#${i + 1}</b> | <span><i class="fas fa-clock"></i> ${
                    v.payload?.timestamp
                        ? new Date(v.payload.timestamp).toLocaleString()
                        : "-"
                }</span>
                </div>
                <div class="vector-payload">
                    <b>Soru:</b> ${v.payload?.prompt || "-"}<br>
                    <b>Cevap:</b> ${v.payload?.response || "-"}
                </div>
            </div>
        `
            )
            .join("");
    } catch (error) {
        vectorList.innerHTML = `<div class="loading"><i class="fas fa-exclamation-triangle"></i> <span>Vektörler yüklenemedi: ${error.message}</span></div>`;
    }
}

async function clearVectors() {
    if (!confirm("Tüm vektör veritabanı temizlensin mi?")) return;
    vectorList.innerHTML = `<div class="loading"><i class="fas fa-spinner fa-spin"></i> <span>Temizleniyor...</span></div>`;
    try {
        const res = await fetch("/api/vectors/clear", { method: "DELETE" });
        if (!res.ok) throw new Error("Temizleme başarısız");
        await loadVectors();
    } catch (error) {
        vectorList.innerHTML = `<div class="loading"><i class="fas fa-exclamation-triangle"></i> <span>Temizleme hatası: ${error.message}</span></div>`;
    }
}

async function loadTrainingExamples() {
    if (
        !confirm(
            "Önceden eğitilmiş örnekler vektör veritabanına yüklensin mi? Bu işlem birkaç saniye sürebilir."
        )
    ) {
        return;
    }

    const originalText = loadTrainingExamplesBtn.innerHTML;
    loadTrainingExamplesBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i>';
    loadTrainingExamplesBtn.disabled = true;

    try {
        const response = await fetch("/api/populate-training-examples", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error("Eğitim örnekleri yüklenemedi");
        }

        const data = await response.json();
        alert(
            `✅ ${data.message}\n\nToplam: ${data.totalExamples} örnek\nEklenen: ${data.addedCount} örnek`
        );

        // Vektör listesini yenile
        await loadVectors();
    } catch (error) {
        alert(`❌ Hata: ${error.message}`);
    } finally {
        loadTrainingExamplesBtn.innerHTML = originalText;
        loadTrainingExamplesBtn.disabled = false;
    }
}
