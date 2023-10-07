const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const https = require('https');

const token = '6597024566:AAGXwbkrq2CTnpxPSQIqTlqZQEK9Ur3SBR4';

const bot = new TelegramBot(token, { polling: true });
const app = express();

app.use(express.json());
app.use(cors());

const start = `⚡<strong>ZipperApp</strong> - твой надежный гид в мире стильной одежды и оригинальных товаров из-за рубежа!
\n\
🔍 <strong>Из каталога или поиска</strong>
Мы представляем вам более 8500 стильных кроссовок из Poizon с полным ассортиментом размеров и цен в рублях.
\n\
👩‍💼 <strong>С помощью оператора</strong>
Просто напиши в чат модель или отправь фотографию, и получи цену на 30-50% дешевле по сравнению с другими магазинами!
\n\
Покупайте стильно и выгодно с <strong>ZipperApp!</strong>`;

const webAppUrl = 'https://zipperapp.vercel.app/';

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  if (text === '/start') {
    await bot.sendMessage(chatId, start, {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Open App', web_app: { url: webAppUrl } }],
        ],
      },
      parse_mode: 'HTML',
    });
  }
});

app.get('/', (req, res) => {
  res.send('Cannot GET /zipperapp');
});

app.get('/web-data', (req, res) => {
  res.send('GET запрос к /web-data успешно обработан');
});

app.post('/web-data', async (req, res) => {
  const { queryId, price } = req.body;
  try {
    await bot.answerWebAppQuery(queryId, {
      type: 'article',
      id: queryId,
      title: 'Успешная покупка',
      input_message_content: {
        message_text: ` Поздравляю с покупкой, вы приобрели товар на сумму ${price}`,
      },
    });
    return res.status(200).json({});
  } catch (e) {
    return res.status(500).json({});
  }
});

const PORT = 443; // Изменяем порт на 443

// Создаем HTTPS сервер
const httpsServer = https.createServer(app);

httpsServer.listen(PORT, () => {
  console.log(`server started on PORT ${PORT}`);
});
