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

router.get('/get/status', async (req, res) => {
    const { userId, order_id } = req.query;

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

router.get('/customer/rank/:userId', async (req, res) => {
    const { userId } = req.params; 

    try {
        const user = await User.findOne({ where: { userId: userId.toString() } });

        if (user) {
            const userRank = user.userRank;

            // Теперь вы можете использовать значение userRank как вам нужно
            
            return res.json({ userId: userId, subscription: userRank });
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



router.get("/customer/bonus/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    let user = await User.findOne({ where: { userId: userId.toString() } });

    if (user) {
      // Отображаем текущее состояние бонуса в ответе
      const bonus = user.userBonus;

      // Если есть реферралы (`referralIds`), проверяются и обновляются бонусы
      const referralIds = JSON.parse(user.referralId);
      if (Array.isArray(referralIds) && referralIds.length > 0) {
        for (const referral of referralIds) {
          const referralId = referral.referralId;

          if (referral.check) {
            continue;
          }

          const referredUser = await User.findOne({
            where: { userId: referralId.toString() },
          });

          if (referredUser) {
            const userOrderArray = JSON.parse(referredUser.userOrder);

            if (userOrderArray !== null && userOrderArray.length > 0) {
              for (const order of userOrderArray) {
                if (order.status === "TRANSITRU" && !order.flag) {
                  // Если флаг тру, начисляем 500, иначе 100
                  const bonusToAdd = referral.check ? 100 : 500;

                  // Добавляем бонус за каждый оплаченный заказ
                  const currentBonus = parseInt(user.userBonus) || 0;
                    user.userBonus = (currentBonus + bonusToAdd).toString();
                    
                    // Помечаем order как проверенный
                    order.flag = true;
                }
              }
                    referral.check = true;
                  referredUser.userOrder = JSON.stringify(userOrderArray);
                  referral.check = true;
                await referredUser.save();
            console.log(`Пользователю ${userId} зачисленно ${bonusToAdd}`);
            return res.status(200).json({ bonus, message: "OK" });
            }
          }
        }
      } else {
        // Если нет реферралов, добавляем бонус за каждый заказ со статусом "TRANSITRU"
        const userOrderArray = JSON.parse(user.userOrder);
        if (userOrderArray !== null && userOrderArray.length > 0) {
          for (const order of userOrderArray) {
            if (order.status === "TRANSITRU" && !order.flag) {
              // Добавляем 100 за каждый оплаченный заказ
              const currentBonus = parseInt(user.userBonus) || 0;
              const bonus = user.userBonus = (currentBonus + 100).toString();

              // Помечаем order как проверенный
              order.flag = true;
             user.userOrder = JSON.stringify(userOrderArray);
              await user.save();
            console.log(`Пользователю ${userId} зачисленно +100`);
            return res.status(200).json({ bonus, message: "OK" });
                
            }
          }
        }
      }

      // Возвращаем ответ с текущим бонусом
      return res.status(200).json({ bonus, message: "OK" });
    } else {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
  } catch (error) {
    console.error("Ошибка при обработке запроса /get/bonus:", error);
    return res.status(500).json({ message: "ERROR" });
  }
});


router.get('/customer/basket/:userId', async (req, res) => {
    const { userId } = req.params;
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

            // Возвращаем успешный статус и корзину пользователя
            return res.status(200).json({ userId, basket: mappedData });
        } else {
            res.status(404).json({ error: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error('Данные корзины пусты', error);
        res.status(200).json([]);
    }
});

router.get('/customers/user/basket/delete/item', async (req, res) => { 
    const { userId, orderId, productId } = req.query;
try {
    const user = await User.findOne({ where: { userId: userId.toString() } });

    if (user) {
        const userOrderArray = JSON.parse(user.userOrder);

        // Находим первый элемент с определенным order_id
        const itemToRemove = userOrderArray.find(item => item.order_id === orderId);

        if (itemToRemove) {
            // Получаем saveUserBonus из элемента
            const saveUserBonus = Number(itemToRemove.saveBonus) || 0;
            const getUserBonus = Number(itemToRemove.newBonus) || 0;

            if (getUserBonus === 0) {
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
            

router.get('/customer/basketpaid/:userId', async (req, res) => {
    const { userId } = req.params; // Параметр из URL, а не из body
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

            // Используем res.json() вместо emitter.emit
            res.json(mappedData);

            // Возвращаем успешный статус
            // res.status(200).send('OK');
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
