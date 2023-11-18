const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.json());



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

const PORT = 8000; // Порт, на котором будет работать сервер
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
