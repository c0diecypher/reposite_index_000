const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid')
const { EventEmitter } = require('events');
const emitter = new EventEmitter();
const User = require('./models'); 
const axios = require('axios');
const crypto = require("crypto")
router.use(express.json());
router.use(cors());

	let status = null
	let paymentId = null
	let ProductOrder = null
	router.post("/customer/pay/subscription", async (req, res) => {
		const {
			productId,
			queryId,
			price,
			name,
			userId,
			order_id
		} = req.body
		console.log(productId, queryId, price, name, userId, order_id)

		// Проверьте, что userId совпадает с ожидаемым
		const allowedUserId = userId
		if (userId !== allowedUserId) {
			return res
				.status(403)
				.json({
					error: "Доступ запрещен",
					message: "Вы не имеете разрешения на выполнение этой операции.",
				})
		}

		try {
			const apikey = "cpfmxaq0su2dy63v4g9zowjh"
			const project_id = "225"
			console.log(project_id, apikey)
			const ProductName = name
			ProductOrder = order_id
			const ProductPrice = price
			console.log(ProductPrice)
			console.log(ProductOrder)
			console.log(ProductName)
			const config = {
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			}

			// Поиск пользователя в базе данных
			const user = await User.findOne({ where: { userId: userId.toString() } })

			if (user) {
				
				// Извлекаем данные пользователя
				const userId = user.userId
				const desc = `
    Название товара: ${ProductName},`
				const params = `
      Поздравляем с покупкой!
      📋 Данные заказа:
🧾 ${ProductName}, 
🎟️ ${ProductOrder}, 
💎 ${ProductPrice}.
ID: ${userId}.

Zipper App снова ждет ваших заказов! ⚡`

				const dataToSend = {
					project_id: project_id,
					order_id: ProductOrder, // Используйте order_id из req.body
					amount: ProductPrice,
					apikey: apikey,
					desc: desc,
					data: params,
				}

				const response = await axios.post(
					"https://p2pkassa.online/api/v1/link",
					dataToSend,
					config
				)
				const result = response.data
				console.log(result)
				if (result && result.link && result.id) {
					// Создаем URL для второго запроса
					const paymentUrl = result.link
					paymentId = result.id
					console.log(paymentUrl)
					console.log(paymentId)
					// Отправляем второй POST-запрос

					const dataToPayment = {
						id: paymentId,
						project_id: project_id,
						apikey: apikey,
					}
					const getPayment = await axios.post(
						"https://p2pkassa.online/api/v1/getPayment",
						dataToPayment,
						config
					)
					const resGetPayment = getPayment.data

					console.log(resGetPayment)

					const match = resGetPayment.match(/\"status\":\"([^"]+)\"/)
					status = match ? match[1] : null

					console.log("Статус оплаты:", status)
					let currentOrders = user.userOrder ? JSON.parse(user.userOrder) : []

					// Добавьте новый заказ к существующему значению
					const newOrder = {
						id: productId,
						name: name,
						order_id: order_id,
						price: price,
						status: status,
					}

					const updatedOrders = currentOrders.concat(newOrder)
					console.log("currentOrders before update:", currentOrders)
					// Обновляем запись в таблице Users
					await User.update(
						{
							userOrder: JSON.stringify(updatedOrders),
						},
						{
							where: { userId: userId },
						}
					)

					console.log("Заказ успешно добавлен.")

					// Создаем URL для второго запроса
					// Отправляем второй POST-запрос
					return res.json({ paymentUrl })
				} else {
					console.log("Отсутствуют данные id и link в ответе")
				}
			} else {
				// Если пользователь не найден, обработка ошибки или возврат 404
				return res
					.status(400)
					.json({ error: "Ошибка", message: "Пользователь не найден." })
			}
		} catch (error) {
			// Обработка ошибки
			console.error(error)
			return res
				.status(500)
				.json({ error: "Ошибка", message: "Внутренняя ошибка сервера." })
		}
	})
	router.post("/customer/pay/subscription/get", async (req, res) => {
		const apikey = "cpfmxaq0su2dy63v4g9zowjh"
		const project_id = "225"
		const config = {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
		}
		const dataToPayment = {
			id: paymentId,
			project_id: project_id,
			apikey: apikey,
		}
		const getPayment = await axios.post(
			"https://p2pkassa.online/api/v1/getPayment",
			dataToPayment,
			config
		)
		const resGetPayment = getPayment.data

		console.log(resGetPayment)

		const match = resGetPayment.match(/\"status\":\"([^"]+)\"/)
		status = match ? match[1] : null

		console.log("Статус оплаты:", status)
	})



module.exports = router;
