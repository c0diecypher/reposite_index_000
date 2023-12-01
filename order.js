const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');
const { EventEmitter } = require('events');
const emitter = new EventEmitter();
const User = require('./models'); 
const axios = require('axios');
router.use(express.json());
router.use(cors());

router.post('/get/payment', async (req, res) => {
    const { userId, order_id } = req.body;

    try {
        const user = await User.findOne({ where: { userId: userId.toString() } });

        if (user) {
            const userOrderArray = JSON.parse(user.userOrder);
        
            const order = userOrderArray.find(order => order.order_id === order_id);
        
            if (order) {
                res.json({ status: order.status });
            } else {
                res.status(404).json({ error: 'Заказ не найден' });
            }
        } else {
            res.status(404).json({ error: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error('Ошибка при запросе статуса из базы данных:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});


router.post('/update/payment', async (req, res) => {
    const { userId, order_id } = req.body;
    try {
        const user = await User.findOne({ where: { userId: userId.toString() } });

        if (user) {
            const userOrderArray = JSON.parse(user.userOrder);
        
            const order = userOrderArray.find(order => order.order_id === order_id);
        
            if (order) {
                // Обновление статуса или других данных платежа
                // Например, order.status = 'PAID';
                res.json({ status: order.status });
            } else {
                res.status(404).json({ error: 'Заказ не найден' });
            }
        } else {
            res.status(404).json({ error: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error('Данные оплаты пусты', error);
        res.status(200).json([]);
    }
});

    
//Создание ордера на оплачу в коризине
router.post('/customer/settings/client/buy/offer/pay/basket', async (req, res) => {
    const { productId,queryId, price, size, name, userId, order_id, time } = req.body;
    
  
    // Проверьте, что userId совпадает с ожидаемым
    const allowedUserId = userId;
    if (userId !== allowedUserId) {
        return res.status(403).json({ error: 'Доступ запрещен', message: 'Вы не имеете разрешения на выполнение этой операции.' });
    }

    try {
        const apikey = 'cpfmxaq0su2dy63v4g9zowjh';
        const project_id = '225';
        
        const ProductName = name;
        const ProductSize = size;
        ProductOrder = order_id;
        const ProductPrice = price.replace(/\s/g, '').replace(/\u00a0/g, '');
        
        const config = {
                  headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                  }
                };
        
        // Поиск пользователя в базе данных
        const user = await User.findOne({ where: { userId: userId.toString() } });

        if (user) {
            // Извлекаем данные пользователя
            const userId = user.userId;
            const userFio = user.userFio || 'Не указано';
            const userAdress = user.userAdress || 'Не указано';
            const phoneNumber = user.phoneNumber || 'Не указано';
            const userCity = user.userCity || 'Не указано';
            const desc = `Название товара: ${ProductName}, 
                      размер: ${ProductSize}, 
                      ФИО: ${userFio}, 
                      Номер для связи ${phoneNumber}
                      Город: ${userCity},
                      Адрес доставки: ${userAdress}`;
            const params = `
      Поздравляем с покупкой!
      📋 Данные заказа:
🧾 ${ProductName}, 
🎟️ ${ProductOrder}, 
📏 ${ProductSize}, 
💎 ${ProductPrice}.
      🚚 Детали доставки:
👤 ${userFio},
📱 ${phoneNumber},
🏙️ ${userAdress},
📍 ${userCity}
ID: ${userId}.

Zipper App снова ждет ваших заказов! ⚡`;

            const dataToSend = {
                  project_id: project_id,
                  order_id: ProductOrder, // Используйте order_id из req.body
                  amount: ProductPrice,
                  apikey: apikey,
                  desc: desc,
                  data: params,
              };
          
            const response = await axios.post('https://p2pkassa.online/api/v1/link', dataToSend, config);
            const result = response.data;
             
            if (result && result.link && result.id) {
              // Создаем URL для второго запроса
              const paymentUrl = result.link;
              paymentId = result.id;
              
              // Отправляем второй POST-запрос

              const dataToPayment = {
                id: paymentId,
                project_id: project_id,
                apikey: apikey
              };
              const getPayment = await axios.post('https://p2pkassa.online/api/v1/getPayment', dataToPayment, config);
              const resGetPayment = getPayment.data;

              
               return res.json({ paymentUrl });  
            } else {
              
              console.log('Отсутствуют данные id и link в ответе');
              
            }
        } else {
            // Если пользователь не найден, обработка ошибки или возврат 404
            return res.status(400).json({ error: 'Ошибка', message: 'Пользователь не найден.' });
        }
    } catch (error) {
        // Обработка ошибки
        console.error(error);
        return res.status(500).json({ error: 'Ошибка', message: 'Внутренняя ошибка сервера.' });
    }
});

router.get('/connect/bonus', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://zipperapp.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.writeHead(200,{
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
    })
    emitter.on('newBonus', (bonus) => {
        res.write(`data: ${JSON.stringify(bonus)} \n\n`)
    })
});

router.post('/get/bonus', async (req, res) => {
  const { userId } = req.body;
  console.log(userId);

  try {
    // Ищем пользователя по userId
    let user = await User.findOne({ where: { userId: userId.toString() } });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Парсим текстовый массив JSON в объект
    const referralIds = JSON.parse(user.referralId);

    if (!Array.isArray(referralIds) || referralIds.length === 0) {
      return res.status(200).send('NO');
    }

    for (const referral of referralIds) {
      const referralId = referral.referralId;

      // Проверяем, был ли уже обработан этот referralId
      if (referral.check) {
        continue; // Пропускаем уже обработанный referralId
      }

      const referredUser = await User.findOne({ where: { userId: referralId.toString() } });

      if (referredUser) {
        const userOrderArray = JSON.parse(referredUser.userOrder);
        console.log('DATAArray', userOrderArray);

        const paidOrders = userOrderArray.filter(order => order.status === 'PAID');

        if (paidOrders.length > 0) {
          // Добавляем +1000 за каждый оплаченный заказ
          const currentBonus = parseInt(user.userBonus) || 0;
          user.userBonus = (currentBonus + 1000).toString();

          // Помечаем referralId как проверенный
          referral.check = true;
          
          // Сохраняем обновленные данные в базе данных
          user.referralId = JSON.stringify(referralIds);
          await user.save();

          // Отправляем событие newBonus с общей суммой userBonus
          const bonus = user.userBonus;
          emitter.emit('newBonus', bonus);
        } else {
          // Если нет оплаченных заказов, бонус не увеличивается
          const currentBonus = parseInt(user.userBonus) || 0;
          user.userBonus = currentBonus.toString();
          referral.check = false;
          // Сохраняем обновленные данные в базе данных
          await user.save();

          // Отправляем событие newBonus с общей суммой userBonus
          const bonus = user.userBonus;
          emitter.emit('newBonus', bonus);
        }
      } else {
        console.log(`Пользователь с referralId ${referralId} не найден`);
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Ошибка при обработке запроса /get/bonus:', error);
    return res.status(500).json({ message: 'Произошла ошибка' });
  }
});

router.get('/connect/basket', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://zipperapp.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.writeHead(200,{
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
    })
    emitter.on('newBasket', (basket) => {
        res.write(`data: ${JSON.stringify(basket)} \n\n`)
    })
});

router.post('/get/basket', async (req, res) => {
    const { userId } = req.body;
    console.log(userId);
    try {
    // Ищем пользователя по userId
    const user = await User.findOne({ where: { userId: userId.toString() } });

    if (user) {
            const userOrderArray = JSON.parse(user.userOrder);
                
            // Ищем все товары с статусом 'WAIT'
            const waitOrders = userOrderArray.filter(order => order.status === 'WAIT');
            // Проверка на undefined перед использованием map
            const mappedData = waitOrders.map(order => {
                if (order) {
                    // Добавьте дополнительные проверки на свойства объекта, если это необходимо
                    return {
                        id: order.id,
                        name: order.name,
                        order_id: order.order_id,
                        price: order.price,
                        size: order.size,
                        status: order.status,
                        time: order.time,
                    };
                }
                return null;
            });
    
    emitter.emit('newBasket', mappedData );

    // Возвращаем успешный статус
    return res.status(200).send('OK');
} else {
  res.status(404).json({ error: 'Пользователь не найден' });
}
    } catch (error) {
        console.error('Данные корзины пусты', error);
        res.status(200).json([]);
    }
    
});

router.get('/connect/basketpaid', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://zipperapp.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.writeHead(200,{
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
    })
    emitter.on('newBasketPaid', (basketpaid) => {
        res.write(`data: ${JSON.stringify(basketpaid)} \n\n`)
    })
});

router.post('/customers/user/basket/delete/item', async (req, res) => {
    const { userId, orderId, productId } = req.body;

    try {
        const user = await User.findOne({ where: { userId: userId.toString() } });

        if (user) {
            const userOrderArray = JSON.parse(user.userOrder);

            // Находим первый элемент с определенным order_id
            const itemToRemove = userOrderArray.find(item => item.order_id === productId);

            if (itemToRemove) {
                // Получаем saveUserBonus из элемента
                const saveUserBonus = Number(itemToRemove.saveBonus) || 0;
                const getUserBonus = Number(itemToRemove.newBonus) || 0;

                if (getUserBonus === 0){
                // Обновляем userBonus в базе данных
                await User.update({ userBonus: Number(user.userBonus) + saveUserBonus }, { where: { userId: userId.toString() } });
                }
                // Удаляем элемент из массива
                userOrderArray.splice(userOrderArray.indexOf(itemToRemove), 1);

                // Обновляем userOrder в базе данных
                await User.update({ userOrder: JSON.stringify(userOrderArray) }, { where: { userId: userId.toString() } });

                res.status(200).json({ success: true, message: 'Товар успешно удален из корзины' });
            } else {
                res.status(404).json({ error: 'Товар с указанным order_id не найден в корзине пользователя' });
            }
        } else {
            res.status(404).json({ error: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error('Ошибка при удалении товара', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});
            

router.post('/get/basketpaid', async (req, res) => {
    const { userId } = req.body;
    try {
        const user = await User.findOne({ where: { userId: userId.toString() } });
        if (user) {
            const userOrderArray = JSON.parse(user.userOrder);
            // Ищем все товары с статусом 'PAID'
            const waitOrders = userOrderArray.filter(order => ['PAID', 'SENT', 'TRANSITCN', 'TRANSITRU', 'DELIVERED'].includes(order.status));
            // Проверка на undefined перед использованием map
            const mappedData = waitOrders.map(order => {
                if (order) {
                    // Добавьте дополнительные проверки на свойства объекта, если это необходимо
                    return {
                        id: order.id,
                        name: order.name,
                        order_id: order.order_id,
                        price: order.price,
                        size: order.size,
                        status: order.status,
                        time: order.time,
                    };
                }
                return null;
            });
    
    emitter.emit('newBasketPaid', mappedData );

    // Возвращаем успешный статус
    return res.status(200).send('OK');
} else {
  res.status(404).json({ error: 'Пользователь не найден' });
}
    } catch (error) {
        console.error('Данные оплаченной корзины пусты', error);
        res.status(200).json([]);
    }
    
});

router.get('/connect/discount', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://zipperapp.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.writeHead(200,{
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
    })
    emitter.on('newDiscount', (discount) => {
        res.write(`data: ${JSON.stringify(discount)} \n\n`)
    })
});

router.post('/get/discount', async (req, res) => {
  const { userId } = req.body;
  console.log(userId);
  try {
    // Ищем пользователя по userId
    let user = await User.findOne({ where: { userId: userId.toString() } });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Парсим текстовый массив JSON в объект
    const referralIds = JSON.parse(user.referralId);

    if (!Array.isArray(referralIds) || referralIds.length === 0) {
          return res.status(200).send('NO');
        }

    
   const discount = user.referralId;
    emitter.emit('newDiscount', discount);
    return res.status(200).send('OK');
    
  } catch (error) {
    console.error('Ошибка при обработке запроса /get/bonus:', error);
    return res.status(500).json({ message: 'Произошла ошибка' });
  }
});

module.exports = router;
