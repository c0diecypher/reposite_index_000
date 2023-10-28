const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const token = process.env.TELEGRAM_BOT_TOKEN;
const { validate } = require('@twa.js/init-data-node');
const User = require('./models'); 
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

app.post('/validate-initdata', async(req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('twa-init-data')) {
    return res.status(400).json({ success: false, error: 'Invalid header Authorization' });
  }
  
  const initData = authHeader.replace('twa-init-data ', '');
  console.log('initData logs:', initData); // Получаем инофрмацию в сыром виде

  try {
  
    validate(initData, token);
     
    const decodedData = decodeURIComponent(initData);

    console.log(decodedData);
    
    const userMatch = /user=([^&]+)/.exec(decodedData);
    if (userMatch) {
  const userData = JSON.parse(userMatch[1]);

  // Получите существующую запись пользователя из базы данных
  const existingUser = await User.findOne({ where: { userId: userData.id.toString() } });

  if (existingUser) {
    // Если пользователь существует, проверьте, изменились ли данные
    if (
      existingUser.first_name !== userData.first_name ||
      existingUser.last_name !== userData.last_name ||
      existingUser.username !== userData.username
    ) {
      // Если данные изменились, обновите запись
      await existingUser.update({
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username,
        photo_url: fileUrl,
      });

      console.log(userData, 'Данные в базе данных успешно обновлены.');
    } else {
      // Если данные не изменились, ничего не делайте
      console.log(userData, 'Данные в базе данных остались без изменений.');
    }
  } else {
    // Если пользователь не существует, создайте новую запись
    const user = {
      userId: userData.id.toString(),
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: userData.username,
      photo_url: fileUrl,
    };

    await User.create(user);

    console.log('Новая запись создана в базе данных:', userData);
  }
   
  }
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

let phoneNumber = '';

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

app.get('/api/getPhotoFile', (req, res) => {
  // Отправляем photoFile на клиентскую сторону
  res.send(photoFile.file_id);
});

let fileUrl = '';
console.log('photo_url:', fileUrl);
app.get('/api/getPhotoUrl', (req, res) => {
  if (photoFile) {
    bot.getFile(photoFile.file_id).then((fileInfo) => {
      // Формируем URL для доступа к файлу
      fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
      res.send(fileUrl);
    }).catch((error) => {
      console.error('Ошибка при получении информации о файле:', error);
      res.status(500).send('Ошибка при получении информации о файле');
    });
  } else {
    res.status(404).send('Информация о файле не найдена');
  }
});

app.get('/fileUrl', (req, res) => {
  res.json({ fileUrl });
});

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server started on PORT ${PORT}`);
});
