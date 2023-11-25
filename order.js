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
        console.error('Ошибка при обновлении данных платежа:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.get('/connect/payment', async (req, res) => {
        const { data } = req.query;
        // Проверяем, что data существует
        if (!data) {
            res.status(400).json({ error: 'Отсутствует параметр data' });
            return;
        }

        // Парсим данные из JSON строки
        const requestData = JSON.parse(decodeURIComponent(data));

        // Извлекаем userId и order_id из requestData
        const { userId, order_id } = requestData.data;
        console.log(userId, order_id);
    try {
        const user = await User.findOne({ where: { userId: userId.toString() } });

        if (user) {
            const userOrderArray = JSON.parse(user.userOrder);
        
            const order = userOrderArray.find(order => order.order_id === order_id);
        
            if (order) {
                    res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': 'https://zipperapp.vercel.app'
                });
            
                 emitter.on('newStatus', (status) => {
                        console.log('Emitted new status:', status);
                        res.write(`${JSON.stringify(status)} \n\n`);
                    });
                
                // Затем генерируем событие нового статуса с обновленным значением
                emitter.emit('newStatus', order.status);
                
               
                
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
    
//Загрузка из БД в корзину данные с WAIT
router.post('/load/basket', async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findOne({ where: { userId: userId.toString() } });
        console.log('HUECOC', user);
        if (user) {
            const userOrderArray = JSON.parse(user.userOrder);
                
            // Ищем все товары с статусом 'WAIT'
            const waitOrders = userOrderArray.filter(order => order.status === 'WAIT');
            console.log('HINIYA', waitOrders);
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
            console.log('PIDORAS', mappedData);

            // Отправляем данные на клиент
            res.status(200).json(mappedData);
        } else {
            res.status(404).json({ error: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error('Ошибка при обновлении данных платежа:', error);
        res.status(200).json([]);
    }
});
//Создание ордера на оплачу в коризине
router.post('/customer/settings/client/buy/offer/pay/basket', async (req, res) => {
    const { productId,queryId, price, size, name, userId, order_id, time } = req.body;
    console.log(productId,queryId, price, size, name, userId, order_id);
  
    // Проверьте, что userId совпадает с ожидаемым
    const allowedUserId = userId;
    if (userId !== allowedUserId) {
        return res.status(403).json({ error: 'Доступ запрещен', message: 'Вы не имеете разрешения на выполнение этой операции.' });
    }

    try {
        const apikey = 'cpfmxaq0su2dy63v4g9zowjh';
        const project_id = '225';
        console.log(project_id, apikey);
        const ProductName = name;
        const ProductSize = size;
        ProductOrder = order_id;
        const ProductPrice = price.replace(/\s/g, '').replace(/\u00a0/g, '');
        console.log(ProductPrice);
        console.log(ProductOrder);
        console.log(ProductSize);
        console.log(ProductName);
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
             console.log(result);
            if (result && result.link && result.id) {
              // Создаем URL для второго запроса
              const paymentUrl = result.link;
              paymentId = result.id;
              console.log(paymentUrl);
              console.log(paymentId);
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

//Загрузка из БД в корзину данные с PAID
router.post('/load/basket/paid', async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findOne({ where: { userId: userId.toString() } });
        console.log('HUECOC', user);
        if (user) {
            const userOrderArray = JSON.parse(user.userOrder);
                
            // Ищем все товары с статусом 'WAIT'
            const waitOrders = userOrderArray.filter(order => ['PAID', 'SENT', 'TRANSITCN', 'TRANSITRU', 'DELIVERED'].includes(order.status));
            console.log('HINIYA', waitOrders);
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
            console.log('PIDORAS', mappedData);

            // Отправляем данные на клиент
            res.status(200).json(mappedData);
        } else {
            res.status(404).json({ error: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error('Ошибка при обновлении данных платежа:', error);
        res.status(200).json([]);
    }
});

router.get('/connect/bonus', async (req, res) => {
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
    const userId = req.body;
    
    emitter.emit('newBonus', bonus)
    res.status(200);
});



module.exports = router;
