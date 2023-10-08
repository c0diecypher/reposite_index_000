const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const token = '6597024566:AAGXwbkrq2CTnpxPSQIqTlqZQEK9Ur3SBR4';
const bot = new TelegramBot(token, {polling: true});
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
Покупайте стильно и выгодно с <strong>ZipperApp!</strong>`
;

const webAppUrl = 'https://zipperapp.vercel.app/'

bot.on('message', async(msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
    if(text === '/start'){
        await bot.sendMessage(chatId,start,{
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Open App', web_app: {url: webAppUrl}}]
                ]
            },
            parse_mode: 'HTML'
        })
    }
});

app.get('/', (req, res) => {
    // Ваш код для обработки запроса на главную страницу здесь
    // Например, вы можете вернуть HTML страницу или другой контент
    res.send('Cannot GET /zipperapp');
  });

// Добавляем обработчик GET запросов для адреса /web-data
app.get('/web-data', (req, res) => {
    // Ваш код обработки GET запроса здесь
    // Например, вы можете вернуть текстовое сообщение
    res.send('GET запрос к /web-data успешно обработан');
  });

app.post('/web-data', async(req, res) => {
    const {queryId, price, size, name} = req.body;
    try {
        await bot.answerWebAppQuery(queryId, {
            type: 'article',
            id: queryId,
            title: 'Успешная покупка',
            input_message_content: {
                message_text: `
            Поздравляем с покупкой! 
        📋 Детали заказа: 
🧾 Название: ${name}
💎 Цена: ${price} ₽, 
📏 Размер: ${size} US.

        🚚 Детали доставки:
📱 Номер для связи: ${phoneNumber}, 
👤 ФИО: ...., 
📍 Адрес выдачи: ...

Спасибо, что пользуетесь zipper app ! ⚡`
            }
        })
        return res.status(200).json({});
    } catch (e) {
        return res.status(500).json({})
    }
})

let phoneNumber = ''; // Здесь будет храниться номер телефона

bot.on('contact', (msg) => {
  const chatId = msg.chat.id;
  const contact = msg.contact;
  
  // Проверяем, что контакт содержит номер телефона
  if (contact.phone_number) {
    phoneNumber = contact.phone_number;  
    // Ваш код для обработки полученного номера телефона здесь
    console.log(`Пользователь отправил номер телефона: ${phoneNumber}`);
    
    // Отправляем ответное сообщение пользователю
    bot.sendMessage(chatId, `Спасибо за отправку номера телефона: ${phoneNumber}`);
  } else {
    // Если контакт не содержит номера телефона, отправляем сообщение об ошибке
    bot.sendMessage(chatId, 'К сожалению, не удалось получить номер телефона.');
  }
});

app.get('/getPhoneNumber', (req, res) => {
  res.json({ phoneNumber });
});

bot.on('message', (msg) => {
  const userId = msg.from.id; // Получаем ID пользователя, который отправил сообщение
  const chatId = msg.chat.id; // Получаем ID чата, в котором было отправлено сообщение

  // Обрабатываем команду /send
  if (msg.text === '/send') {
    // Используем метод getUserProfilePhotos для получения фотографий профиля пользователя
    bot.getUserProfilePhotos(userId).then((result) => {
      const photos = result.photos;

      if (photos.length > 0) {
        // Получаем объект File для изображения профиля
        const photoFile = photos[0][0];

        // Получаем URL изображения профиля
        bot.getFileLink(photoFile.file_id).then((photoUrl) => {
          // Отправляем URL изображения профиля обратно в чат
          bot.sendMessage(chatId, `Изображение профиля пользователя для команды /send: ${photoUrl}`);
        }).catch((error) => {
          bot.sendMessage(chatId, 'Произошла ошибка при получении URL изображения профиля для команды /send.');
          console.error('Ошибка при получении URL изображения профиля для команды /send:', error);
        });
      } else {
        bot.sendMessage(chatId, 'Пользователь не имеет фотографий профиля для команды /send.');
      }
    }).catch((error) => {
      bot.sendMessage(chatId, 'Произошла ошибка при получении изображения профиля для команды /send.');
      console.error('Ошибка при получении изображения профиля для команды /send:', error);
    });
  }
});

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server started on PORT ${PORT}`);
});
