const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');
const User = require('./models');
const { EventEmitter } = require('events');

const eventEmitter = new EventEmitter();

router.use(express.json());
router.use(cors());

// SSE endpoint
// Глобальная область
const listener = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
};

router.get('/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    eventEmitter.addListener('paymentUpdate', listener);

    res.on('finish', () => {
        eventEmitter.removeListener('paymentUpdate', listener);
    });
});

// Обработка обновлений статуса и отправка через SSE
const sendPaymentUpdate = (status) => {
  eventEmitter.emit('paymentUpdate', { status });
};

router.post('/get/payment', async (req, res) => {
    const { userId, order_id } = req.body;

    try {
        const user = await User.findOne({ where: { userId: userId.toString() } });

        if (user) {
            const userOrderArray = JSON.parse(user.userOrder);

            const order = userOrderArray.find(order => order.order_id === order_id);

            if (order) {
                res.json({ status: order.status });
                console.log('Отправлено обновление:', order.status);

                // Отправка обновления через SSE
                sendPaymentUpdate(order.status);
                console.log('Отправлено обновление:', order.status);
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
                res.json({ status: order.status });

                // Отправка обновления через SSE
                sendPaymentUpdate(order.status);
                console.log('Отправлено обновление:', order.status);
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

module.exports = router;
