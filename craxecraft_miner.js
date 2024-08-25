const mineflayer = require('mineflayer');
const readline = require('readline');
const Vec3 = require('vec3');
const fs = require('fs');

// Bot konfigürasyonu
const bot = mineflayer.createBot({
  host: 'play.craxecraft.com',
  port: 25565,
  username: 'ses123',
  password: 'lodestone123',
  version: '1.16.5'
});

// Madencilik yapılacak konumlar
const locations = [
  new Vec3(9000, 101, 2394),
  new Vec3(9000, 101, 2393),
  new Vec3(9000, 101, 2392),
  new Vec3(9000, 101, 2391),
  new Vec3(9000, 101, 2390),
  new Vec3(9000, 101, 2389)
];

let index = 0;

bot.on('spawn', () => {
  console.log('Bot doğdu');

  setTimeout(() => {
    console.log('Adım atılıyor...');
    bot.setControlState('forward', true);
    setTimeout(() => {
      bot.setControlState('forward', false); 
    }, 1000); 
  }, 10000); 

  setTimeout(() => {
    console.log('Login komutu gönderiliyor...');
    bot.chat('/login lodestone123');

    setTimeout(() => {
      console.log('Skyblock komutu gönderiliyor...');
      bot.chat('/skyblock');

      setTimeout(() => {
        console.log('Adaya gidiyor...');
        bot.chat('/home');
      }, 3000);

      setTimeout(startMining, 5000);
    }, 3000);

  }, 1000);
});

function startMining() {
  console.log('Madencilik başlıyor...');
  setInterval(async () => {
    const location = locations[index];
    const block = bot.blockAt(location);

    // Blok türünü kontrol et
    if (block && ['diamond_ore', 'emerald_ore', 'gold_ore', 'iron_ore', 'coal_ore', 'lapis_ore', 'redstone_ore', 'stone'].includes(block.name)) {
      try {
        await bot.dig(block); // Bloğu kaz
        console.log(`Kazılıyor: ${block.name} - (${location.x}, ${location.y}, ${location.z})`);
      } catch (error) {
        console.error('Kaza sırasında hata:', error);
      }
    }
    index = (index + 1) % locations.length;
  }, 150);
}

// Minecraft renk kodlarını temizlemek için yardımcı fonksiyon
function removeColorCodes(text) {
  if (typeof text !== 'string') {
    return ''; // Eğer string değilse boş string döndür
  }
  // Sadece renk kodlarını temizle (hem § hem de & işaretleri için)
  return text.replace(/([§&][0-9a-fk-or])/g, '');
}

// Matematiksel ifadeleri çözmek için yardımcı fonksiyon
function evaluateMathExpression(expression) {
  // Sadece temel matematiksel işlemler için geçerli olan bir regex
  const safeExpression = expression.replace(/[^0-9+\-*/().]/g, '');
  try {
    const result = Function('"use strict";return (' + safeExpression + ')')();
    return result.toString();
  } catch (e) {
    console.error('Matematiksel ifadeyi değerlendirirken hata:', e);
    return 'Hata'; // İfade geçersizse hata mesajı döndür
  }
}

// Mesajları dosyaya kaydetmek için yardımcı fonksiyon
function saveMessage(type, text) {
  const filePath = 'messages.json';
  const timestamp = new Date().toISOString();

  let messages = [];
  try {
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf8');
      if (rawData.trim().length > 0) { // Boş dosya kontrolü
        messages = JSON.parse(rawData);
      }
    }
  } catch (error) {
    console.error('JSON dosyasını okurken hata:', error);
    messages = [];
  }

  // Yeni mesajı ekle
  messages.push({ timestamp, type, text });

  // Dosyayı güncelle
  try {
    fs.writeFileSync(filePath, JSON.stringify(messages, null, 2), 'utf8');
  } catch (error) {
    console.error('JSON dosyasını yazarken hata:', error);
  }
}

// Title olayını işleme
bot.on('title', (titleData) => {
  let titleText = '';

  // titleData'nin text alanını kontrol et
  if (typeof titleData === 'object' && titleData.text) {
    titleText = titleData.text;
  } else if (typeof titleData === 'string') {
    titleText = titleData; // Eğer string formatında ise
  }

  const cleanText = removeColorCodes(titleText);

  // Matematiksel ifadeyi çöz
  const result = evaluateMathExpression(cleanText);

  console.log(`Sunucunun yolladığı title: ${cleanText}`);

  // Sonucu JSON dosyasına kaydet
  saveMessage('title', cleanText);

  // Ayrıca sonucu chat'e gönder
  bot.chat(result);
});

bot.on('error', (err) => {
  console.error('Bot hata aldı:', err);
});

bot.on('end', () => {
  console.log('Bot bağlantısı kesildi.');
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input) => {
  if (input.trim()) {
    bot.chat(input.trim());
  }
});
