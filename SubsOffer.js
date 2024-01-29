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

router.post("/customer/pay/subscription", async (req, res) => {
		const {
			queryId,
			price,
			name,
			userId,
		} = req.body

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
			const subsName = name
			const subsPrice = price
      const orderId = uuidv4()
      const productId = "1100011"
			const config = {
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			}

			// Поиск пользователя в базе данных
			const user = await User.findOne({ where: { userId: userId } })

			if (user) {
				const desc = `Подписка ${subsName}`
				const params = `
      Поздравляем с покупкой!
Теперь покупки с подпиской ${subsName} станут намного выгоднее

Zipper App снова ждет ваших заказов! ⚡`

				const dataToSend = {
					project_id: project_id,
					order_id: orderId,
					amount: subsPrice,
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
						name: subsName,
						order_id: orderId,
						price: subsPrice,
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
	router.post("/get/pay/subsription", async (req, res) => {
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

router.post("/customer/pay/subscription/status", async (req, res) => {
		// Ваш код для POST-запроса
		const { id, apikey, order_id, project_id, amount, createDateTime, data } =
			req.body
		const sign = crypto
			.createHash("sha256")
			.update(`${id}:${order_id}:${project_id}:${apikey}`)
			.digest("hex")

		if (sign !== sign) {
			return res.status(400).send("Неверная подпись")
		}

		if (
			data !== undefined &&
			id !== undefined &&
			order_id !== undefined &&
			createDateTime !== undefined &&
			amount !== undefined
		) {
			// Платеж прошел успешно, проводите операции по обработке платежа
			console.log("Оплачено", { id, order_id, amount, createDateTime, data })

			// Отправляем статус только если все поля определены
			res.send("OK")

			// Находим пользователя с совпадающими данными в userOrder
			const user = await User.findOne({
				where: {
					userOrder: {
						[Sequelize.Op.like]: `%${order_id}%`, // Используем order_id вместо data
					},
				},
			})

			if (user) {
				const chatId = user.userId
				const message = `${data}`

				// Отправляем сообщение пользователю
				bot.sendMessage(chatId, message)

				let currentOrders = user.userOrder ? JSON.parse(user.userOrder) : []

				// Обновляем статус заказов с соответствующим order_id
				const updatedOrders = currentOrders.map((order) => {
					if (order.order_id === order_id) {
						return { ...order, status: "PAID" }
					}
					return order
				})

				// Обновляем запись в таблице Users
				await User.update(
					{
						userOrder: JSON.stringify(updatedOrders),
					},
					{
						where: { userId: user.userId },
					}
				)

				console.log("Статус заказа успешно обновлен.")
			}
		}
	})

module.exports = router;
