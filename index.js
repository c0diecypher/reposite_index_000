const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const token = process.env.TELEGRAM_BOT_TOKEN;
const { validate } = require('@twa.js/init-data-node');
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

app.post('/validate-initdata', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('twa-init-data')) {
    return res.status(400).json({ success: false, error: 'Invalid header Authorization' });
  }

  const initData = authHeader.replace('twa-init-data ', '');
  console.log('initData logs:', initData); // Получаем инофрмацию в сыром виде
  //дальше отсюда уже можно создавать базу 
  try {
    // Выполняем валидацию данных initData, но стоит учесть, что validate это функция из которой нельзя получить информацию
    // тк она используется из другой библиотеки tma + hmac...
    // Получается, что дергать данные пользователей можно будет в самом const initData
    validate(initData, token);
     
    // Если валидация успешна, вы можете выполнить необходимые действия

    res.json({ success: true, message: 'Authorized valid' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

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
});

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
        photoFile = photos[0][0];
        console.log('photo_url:', photoFile); //фоточка пользователя, нужно ее переместить в команду /start
        // Отправляем изображение профиля обратно в чат
        bot.sendPhoto(chatId, photoFile.file_id);
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
