const { Sequelize } = require('sequelize');
const { EventEmitter } = require('events');
const express = require('express');
const router = express.Router();
const User = require('./models');

const eventEmitter = new EventEmitter();

// SSE endpoint
router.get('/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const listener = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    eventEmitter.addListener('paymentUpdate', listener);

    req.on('close', () => {
        eventEmitter.removeListener('paymentUpdate', listener);
    });
});

// Мониторинг изменений в базе данных (пример с sequelize)
User.addHook('afterSave', (user) => {
    // Получаем userId и order_id из запроса
    const { userId, order_id } = req.body;

    // Проверяем, изменился ли статус заказа
    const order = user.userOrderArray.find(order => order.order_id === order_id && order.changed('status'));

    if (order) {
        // Отправляем обновление через SSE
        sendPaymentUpdate(userId, order_id, order.status);
    }
});

// Обработка обновлений статуса и отправка через SSE
const sendPaymentUpdate = (userId, order_id, status) => {
    eventEmitter.emit('paymentUpdate', { userId, order_id, status });
};

module.exports = router;
