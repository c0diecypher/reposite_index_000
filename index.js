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

let userId = '';
let photoUrl = '';

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
        filePath: photoUrl,
        phoneNumber: phoneNumber,
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
      filePath: photoUrl,
      phoneNumber: phoneNumber,
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

  if (contact.phone_number) {
    phoneNumber = contact.phone_number;
    console.log(`Пользователь отправил номер телефона: ${phoneNumber}`);

    // Проверяем, есть ли фотография профиля контакта
    if (contact.photo && contact.photo.length > 0) {
      const photo = contact.photo[0]; // Получаем первую фотографию (обычно это самая большая)
      const photoFileId = photo.file_id;

      // Отправляем фотографию профиля в чат
      bot.sendPhoto(chatId, photoFileId);

      // Получаем URL фотографии профиля
      bot.getFile(photoFileId).then((fileInfo) => {
        const photoUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
        console.log(`URL фотографии профиля контакта: ${photoUrl}`);
      }).catch((error) => {
        console.error('Ошибка при получении информации о фотографии профиля:', error);
      });
    }

    // Отправляем ответное сообщение пользователю
    bot.sendMessage(chatId, `Ваш номер успешно привязан`);
  } else {
    bot.sendMessage(chatId, 'Для корректной работы приложения рекомендуем привязать номер');
  }
});

let phoneNumber = '';

app.get('/getPhoneNumber', (req, res) => {
  res.json({ phoneNumber });
});

bot.on('message', async(msg) => {
  userId = msg.from.id; // Получаем ID пользователя, который отправил сообщение
  const chatId = msg.chat.id; // Получаем ID чата, в котором было отправлено сообщение

  // Обрабатываем команду /send
  if (msg.text === '/start') {
    // Используем метод getUserProfilePhotos для получения фотографий профиля пользователя
    await bot.getUserProfilePhotos(userId, { limit: 1 }).then((result) => {
      const photos = result.photos;

      if (photos.length > 0) {
        // Получаем объект File для изображения профиля
        photoFile = photos[0][0];
        console.log('photo_url:', photoFile); // фоточка пользователя, нужно ее переместить в команду /start

        // Отправляем изображение профиля обратно в чат
        // bot.sendPhoto(chatId, photoFile.file_id);
        // console.log(userId, photoFile.file_id);

        bot.getFile(photoFile.file_id).then((fileInfo) => {
          photoUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
          console.log('Данные фоточки', 
photoUrl);

          // Создайте или обновите запись пользователя в базе данных
          User.findOne({ where: { userId: userId.toString() } }).then((user) => {
            if (user) {
              // Если пользователь существует, обновите его файлы
              user.update({ filePath: photoUrl }).then(() => {
                console.log('Данные пользователя успешно обновлены.');
              }).catch((error) => {
                console.error('Ошибка при обновлении данных пользователя:', error);
              });
            } else {
              // Если пользователь не существует, создайте новую запись
              User.create({ userId: userId.toString(), filePath: photoUrl }).then(() => {
                console.log('Новый пользователь успешно создан.');
              }).catch((error) => {
                console.error('Ошибка при создании нового пользователя:', error);
              });
            }
          }).catch((error) => {
            console.error('Ошибка при поиске пользователя в базе данных:', error);
          });
        }).catch((error) => {
          console.error('Ошибка при получении информации о файле:', error);
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

app.get('/userProfile/:userId', (req, res) => {
  const userId = req.params.userId; // Получите userId из параметров запроса

  // Используйте Sequelize для поиска пользователя по userId
  User.findOne({ where: { userId } })
    .then((user) => {
      if (user) {
        // Отправьте данные пользователя клиенту
        res.json({
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          photoUrl: user.filePath, // Ссылка на изображение
        });
      } else {
        res.status(404).json({ error: 'Пользователь не найден' });
      }
    })
    .catch((error) => {
      console.error('Ошибка при поиске пользователя:', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    });
});

const PORT = 8000;

app.listen(PORT, () => {
  console.log(`Server started on PORT ${PORT}`);
});
