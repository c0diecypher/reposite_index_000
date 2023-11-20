const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');
const User = require('./models'); 
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

router.post('/load/basket', async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findOne({ where: { userId: userId.toString() } });

        if (user) {
            const userOrderArray = JSON.parse(user.userOrder);

            // Получить только определенные поля для товаров с статусом "WAIT"
            const waitOrders = await Order.findAll({
                attributes: ['id', 'name', 'order_id', 'price', 'size', 'status'],
                where: {
                    order_id: userOrderArray.map(order => order.order_id),
                    status: 'WAIT',
                }
            });

            // Отправить данные на клиент
            res.status(200).json(waitOrders);
        } else {
            res.status(404).json({ error: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error('Ошибка при обновлении данных платежа:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

module.exports = router;
