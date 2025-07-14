const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function configureRemote() {
    console.log("🌐 Uzak Sunucu Konfigürasyonu\n");

    try {
        // Kullanıcıdan bilgileri al
        const remoteHost = await question(
            "Uzak sunucu IP adresi veya domain: "
        );
        const remoteMongoPort =
            (await question("MongoDB port (varsayılan: 27017): ")) || "27017";
        const remoteQdrantPort =
            (await question("Qdrant port (varsayılan: 6333): ")) || "6333";
        const remoteOllamaPort =
            (await question("Ollama port (varsayılan: 11434): ")) || "11434";
        const useSSL =
            (await question("SSL kullanılsın mı? (y/n, varsayılan: n): ")) ||
            "n";

        // Environment dosyasını oluştur
        const envContent = `# Node.js Environment
NODE_ENV=production

# MongoDB Configuration (Remote)
MONGODB_URI=mongodb://${remoteHost}:${remoteMongoPort}/ai_logs

# Qdrant Configuration (Remote)
QDRANT_URL=http://${remoteHost}:${remoteQdrantPort}
QDRANT_COLLECTION=ai_logs

# Ollama Configuration (Remote)
OLLAMA_URL=http://${remoteHost}:${remoteOllamaPort}/api
OLLAMA_CHAT_MODEL=llama3
OLLAMA_EMBEDDING_MODEL=all-minilm

# AI Configuration
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=512

# Server Configuration
PORT=3000

# SSL Configuration
${
    useSSL.toLowerCase() === "y"
        ? `SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem`
        : "# SSL_CERT_PATH=/etc/nginx/ssl/cert.pem\n# SSL_KEY_PATH=/etc/nginx/ssl/key.pem"
}

# Security
TRUST_PROXY=true
`;

        // env.production dosyasını güncelle
        fs.writeFileSync("env.production", envContent);

        // Nginx konfigürasyonunu seç
        const nginxConfig =
            useSSL.toLowerCase() === "y" ? "nginx-ssl.conf" : "nginx.conf";
        console.log(`\n📝 Nginx konfigürasyonu: ${nginxConfig}`);

        // Docker Compose dosyasını güncelle
        const dockerComposeContent = `version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: ai-app-nginx-remote
    ports:
      - "80:80"
${useSSL.toLowerCase() === "y" ? '      - "443:443"' : ""}
    volumes:
      - ./nginx/${nginxConfig}:/etc/nginx/nginx.conf:ro
${useSSL.toLowerCase() === "y" ? "      - ./nginx/ssl:/etc/nginx/ssl:ro" : ""}
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: .
    container_name: ai-app-backend-remote
    expose:
      - "3000"
    env_file:
      - env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  nginx_ssl:
    driver: local
`;

        fs.writeFileSync("docker-compose.remote.yml", dockerComposeContent);

        console.log("\n✅ Konfigürasyon tamamlandı!");
        console.log("\n📋 Oluşturulan dosyalar:");
        console.log("   📄 env.production");
        console.log("   🐳 docker-compose.remote.yml");

        if (useSSL.toLowerCase() === "y") {
            console.log("\n🔐 SSL sertifikaları oluşturmak için:");
            console.log("   npm run setup:ssl");
        }

        console.log("\n🚀 Uzak sunucuya bağlanmak için:");
        console.log("   npm run docker:remote");

        console.log("\n📝 Uzak sunucuda çalışması gereken servisler:");
        console.log(`   🗄️  MongoDB: ${remoteHost}:${remoteMongoPort}`);
        console.log(`   🔍 Qdrant: ${remoteHost}:${remoteQdrantPort}`);
        console.log(`   🤖 Ollama: ${remoteHost}:${remoteOllamaPort}`);
    } catch (error) {
        console.error("❌ Konfigürasyon hatası:", error.message);
    } finally {
        rl.close();
    }
}

// Script'i çalıştır
if (require.main === module) {
    configureRemote();
}

module.exports = { configureRemote };
