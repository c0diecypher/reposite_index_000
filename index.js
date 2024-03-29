
	const TelegramBot = require("node-telegram-bot-api")
	const express = require("express")
	const { Sequelize, Op, literal } = require("sequelize")
	const events = require("events")
	const cors = require("cors")
	const https = require("https")
	const crypto = require("crypto")
	const bodyParser = require("body-parser")
	const token = process.env.TELEGRAM_BOT_TOKEN
	const { validate } = require("@twa.js/init-data-node")
	const User = require("./models")
	const fs = require("fs")
	const axios = require("axios")
	const path = require("path") // Импортируем библиотеку path
	const bot = new TelegramBot(token, { polling: true })
	const app = express()
	const emitter = new events.EventEmitter()
	const productRouter = require("./product.route")
	app.use("/api", productRouter)
	app.use(express.json())
	app.use(cors())
	const start = `⚡<strong>ZipperApp</strong> - твой надежный гид в мире стильной одежды и оригинальных товаров из-за рубежа!
\n\
🔍 <strong>Из каталога или поиска</strong>
Мы представляем вам более 8500 стильных кроссовок из Poizon с полным ассортиментом размеров и цен в рублях.
\n\
👩‍💼 <strong>С помощью оператора</strong>
Просто напиши в чат модель или отправь фотографию, и получи цену на 30-50% дешевле по сравнению с другими магазинами!
\n\
Покупайте стильно и выгодно с <strong>ZipperApp!</strong>`
	let userId = ""
	let photoUrl = ""

	app.post("/validate-initdata", async (req, res) => {
		try {
			const authHeader = req.headers.authorization

			if (!authHeader || !authHeader.startsWith("twa-init-data ")) {
				return res
					.status(400)
					.json({ success: false, error: "Invalid header Authorization" })
			}

			const initData = authHeader.replace("twa-init-data ", "")
			console.log("initData logs:", initData)

			const decodedData = decodeURIComponent(initData)
			console.log(decodedData)

			// Проверка типа данных и валидация
			const userDataMatch = /user=([^&]+)/.exec(decodedData)
			if (!userDataMatch) {
				throw new Error("Invalid user data")
			}

			const userData = JSON.parse(userDataMatch[1])
			const referralLink = `https://t.me/zipperstore_bot?start=${userData.id.toString()}`
			const bonus = "500"

			const existingUser = await User.findOne({
				where: { userId: userData.id.toString() },
			})

			if (existingUser) {
				const updates = {
					first_name: userData.first_name,
					last_name: userData.last_name,
					username: userData.username,
					referralLink: referralLink,
					startBonus: true,
				}

				// Проверка, установлен ли startBonus в true перед обновлением userBonus
				if (!existingUser.startBonus) {
					updates.userBonus = bonus
					console.log(
						userData,
						"Данные в базе данных успешно обновлены, включая userBonus."
					)
				} else {
					console.log(
						userData,
						"Данные в базе данных успешно обновлены. Активация userBonus запрещена."
					)
				}

				// Обновление данных пользователя в единственном запросе
				await existingUser.update(updates)
				console.log(userData, "Данные в базе данных успешно обновлены.")
			} else {
				const user = {
					userId: userData.id.toString(),
					first_name: userData.first_name,
					last_name: userData.last_name,
					username: userData.username,
					referralLink: referralLink,
				}

				// Создание новой записи в базе данных
				await User.create(user)
				console.log("Новая запись создана в базе данных:", userData)
			}

			res.json({ success: true, message: "Authorized valid" })
		} catch (error) {
			console.error("Error:", error)
			res.status(400).json({ success: false, error: error.message })
		}
	})

	const webAppUrl = "https://zipperapp.vercel.app/"

	bot.on("message", async (msg) => {
		const chatId = msg.chat.id
		const userId = msg.from.id
		const text = msg.text
		const match = text.match(/^\/start (.+)$/)
		const referralCode = match ? match[1] : null
		console.log(chatId)
		if (text === "/start") {
			await bot.sendMessage(chatId, start, {
				reply_markup: {
					inline_keyboard: [
						[{ text: "Open App", web_app: { url: webAppUrl } }],
					],
				},
				parse_mode: "HTML",
			})
		}
	})

	bot.onText(/\/start (.+)/, async (msg, match) => {
		const chatId = msg.chat.id
		const referralId = msg.from.id
		const referralName = msg.from.first_name
		const referralCode = match[1]

		try {
			// Проверяем, что referralId и referralCode не одинаковы
			if (referralId.toString() === referralCode.toString()) {
				bot.sendMessage(
					chatId,
					"Нельзя применять собственный реферальный код. Попробуйте пригласить друзей!"
				)
				return
			}

			// Ищем пользователя в базе данных по userId (referralCode)
			const existingUser = await User.findOne({
				where: { userId: referralCode.toString() },
			})

			if (!existingUser) {
				bot.sendMessage(
					chatId,
					"Данный реферальный код не существует. Пожалуйста, уточните правильный реферальный код."
				)
				return
			}
			// Проверяем, не использован ли уже этот referralId другими пользователями
			const allUsersWithReferralId = await User.findOne({
				where: {
					referralId: {
						[Op.like]: `%${referralId}%`,
					},
				},
			})

			if (allUsersWithReferralId) {
				bot.sendMessage(chatId, "Вы уже используете реферальный код.")
				return
			}

			// Если пользователь существует, проверяем, был ли уже использован этот referralId
			const currentReferrals = existingUser.referralId
				? JSON.parse(existingUser.referralId)
				: []

			// Проверяем, не был ли уже использован этот referralId
			if (currentReferrals.some((ref) => ref.referralId === referralId)) {
				bot.sendMessage(
					chatId,
					"Этот реферальный код уже был использован данным пользователем. Реферальные коды можно использовать только один раз."
				)
				return
			}

			// Добавляем новый referralId в массив
			const newReferral = {
				referralId: referralId,
			}
			const updatedReferrals = [...currentReferrals, newReferral]

			// Обновляем запись в таблице Users
			await User.update(
				{
					referralId: JSON.stringify(updatedReferrals),
				},
				{
					where: { userId: referralCode.toString() },
				}
			)

			console.log("Данные пользователя успешно обновлены.")

			// Отправляем сообщение с полученным значением
			bot.sendMessage(
				chatId,
				`Привет, ${referralName}! Ты перешел по реферальному коду: ${referralCode}`
			)
		} catch (error) {
			console.error("Ошибка при обработке команды /start:", error)
			bot.sendMessage(chatId, "Произошла ошибка при обработке команды /start.")
		}
	})

	app.post("/customer/settings/client/buy/offer", async (req, res) => {
		const { queryId, price, size, name, userId, order_id } = req.body
		console.log(queryId, price, size, name, userId, order_id)
		// Поиск пользователя в базе данных
		const user = await User.findOne({ where: { userId: userId.toString() } })

		if (user) {
			// Извлекаем данные пользователя
			const userFio = user.userFio || "Не указано"
			const userAdress = user.userAdress || "Не указано"
			const phoneNumber = user.phoneNumber || "Не указано"
			const userCity = user.userCity || "Не указано"

			try {
				await bot.answerWebAppQuery(queryId, {
					type: "article",
					id: userId,
					title: "Успешная покупка",
					input_message_content: {
						message_text: `
        Поздравляем с покупкой! 
      📋 Детали заказа:
🎟️ Номер заказа: ${order_id}
🧾 Название: ${name}
💎 Цена: ${price}, 
📏 Размер: ${size} EU.

      🚚 Детали доставки:
📱 Номер для связи: ${phoneNumber}, 
👤 ФИО: ${userFio},
🏙️ Город: ${userCity},
📍 Адрес выдачи: ${userAdress}

Спасибо, что пользуетесь zipper app ! ⚡
                    `,
					},
				})
				return res.status(200).json({})
			} catch (error) {
				// Обработка ошибки
				console.error(error)
				return res.status(500).json({})
			}
		} else {
			// Если пользователь не найден, обработка ошибки или возврат 404
			return res.status(404).json({ error: "Пользователь не найден" })
		}
	})
	let status = null
	let paymentId = null
	let ProductOrder = null
	app.post("/customer/settings/client/buy/offer/pay", async (req, res) => {
		const {
			productId,
			queryId,
			price,
			size,
			name,
			userId,
			order_id,
			time,
			remainingBonus,
			saveBonus,
			newBonus,
		} = req.body
		console.log(productId, queryId, price, size, name, userId, order_id)

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
			const ProductSize = size
			const saveUserBonus = saveBonus
			const getUserBonus = newBonus
			ProductOrder = order_id
			const ProductPrice = price.replace(/\s/g, "").replace(/\u00a0/g, "")
			console.log(ProductPrice)
			console.log(ProductOrder)
			console.log(ProductSize)
			console.log(ProductName)
			const config = {
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			}

			// Поиск пользователя в базе данных
			const user = await User.findOne({ where: { userId: userId.toString() } })

			if (user) {
				const currentBonus = user.userBonus || 0 // Default to 0 if userBonus is not set
				const changeBonus = remainingBonus
				const updatedBonus = parseInt(changeBonus, 10) // Assuming remainingBonus is a number

				if (getUserBonus === 0) {
					// Обновляем поле userBonus только если newBonus равен 0
					user.userBonus = updatedBonus
					await user.save() // Сохраняем изменения в базе данных
				}
				// Извлекаем данные пользователя
				const userId = user.userId
				const userFio = user.userFio || "Не указано"
				const userAdress = user.userAdress || "Не указано"
				const phoneNumber = user.phoneNumber || "Не указано"
				const userCity = user.userCity || "Не указано"
				const desc = `Название товара: ${ProductName}, 
                      размер: ${ProductSize}, 
                      ФИО: ${userFio}, 
                      Номер для связи ${phoneNumber}
                      Город: ${userCity},
                      Адрес доставки: ${userAdress}`
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
						size: size,
						status: status,
						time: time,
						saveBonus: saveUserBonus,
						newBonus: getUserBonus,
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
	app.post("/get/pay", async (req, res) => {
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

	app.use(bodyParser.json())
	const resOrder = require("./order")
	app.use("/", resOrder)
	const resSubs = require("./SubsOffer")
	app.use("/", resSubs)
	// Используем bodyParser для парсинга тела POST-запроса
	app.use(bodyParser.urlencoded({ extended: false }))
	app.use(bodyParser.json())

	app.post("/customer/client/pay/status", async (req, res) => {
		// Ваш код для POST-запроса
		const { id, apikey, order_id, project_id, amount, createDateTime, data } =
			req.body
		console.log(id, apikey, order_id, project_id, amount, createDateTime, data)
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

	bot.on("contact", async (msg) => {
		const chatId = msg.chat.id
		const contact = msg.contact
		const userId = msg.from.id
		// Проверяем, что контакт содержит номер телефона
		if (contact.phone_number) {
			numberPhone = contact.phone_number
			User.findOne({ where: { userId: userId.toString() } })
				.then((user) => {
					if (user) {
						// Если пользователь существует, обновите его файлы
						user
							.update({ tgPhoneNumber: numberPhone })
							.then(() => {
								console.log("Данные пользователя успешно обновлены.")
							})
							.catch((error) => {
								console.error(
									"Ошибка при обновлении данных пользователя:",
									error
								)
							})
					} else {
						// Если пользователь не существует, создайте новую запись
						User.create({
							userId: userId.toString(),
							tgPhoneNumber: numberPhone,
						})
							.then(() => {
								console.log("Новый пользователь успешно создан.")
							})
							.catch((error) => {
								console.error("Ошибка при создании нового пользователя:", error)
							})
					}
				})
				.catch((error) => {
					console.error("Ошибка при поиске пользователя в базе данных:", error)
				})
			console.log(`Пользователь отправил номер телефона: ${numberPhone}`)

			// Отправляем ответное сообщение пользователю
			bot.sendMessage(
				chatId,
				`Спасибо за отправку номера телефона: ${numberPhone}`
			)
		} else {
			// Если контакт не содержит номера телефона, отправляем сообщение об ошибке
			bot.sendMessage(
				chatId,
				"К сожалению, не удалось получить номер телефона."
			)
		}
	})

	app.get("/customer/settings/client/get/:userId", async (req, res) => {
		const userId = req.params.userId

		try {
			// Здесь используйте ваш метод или ORM для поиска пользователя по userId
			const user = await User.findOne({ where: { userId } })

			if (user) {
				const tgPhoneNumber = user.tgPhoneNumber

				// Отправьте userAdress и userFio на клиентскую сторону
				res.json({
					userId,
					tgPhoneNumber,
				})
			} else {
				res.status(404).json({ message: "Пользователь не найден" })
			}
		} catch (error) {
			console.error("Ошибка при запросе данных из базы данных:", error)
			res.status(500).json({ message: "Внутренняя ошибка сервера" })
		}
	})

	app.get("/getPhoneNumber", (req, res) => {
		// Здесь вы можете выполнить запрос к базе данных, чтобы получить данные
		// В данном контексте, просто возвращаем пустой объект, но обычно это будет запрос к базе данных
		res.json({ userId: "", tgPhoneNumber: "" })
	})

	bot.on("message", async (msg) => {
		const userId = msg.from.id // Получаем ID пользователя, который отправил сообщение
		const chatId = msg.chat.id // Получаем ID чата, в котором было отправлено сообщение

		// Обрабатываем команду /start
		if (msg.text === "/start") {
			// Используем метод getUserProfilePhotos для получения фотографий профиля пользователя
			await bot
				.getUserProfilePhotos(userId, { limit: 1 })
				.then((result) => {
					const photos = result.photos

					if (photos.length > 0) {
						// Получаем объект File для изображения профиля
						const photoFile = photos[0][0]

						// Получите информацию о файле
						bot
							.getFile(photoFile.file_id)
							.then((fileInfo) => {
								const fileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`
								console.log("Ссылка на фото:", fileUrl)

								// Скачайте файл и сохраните его на сервере
								const downloadDir = path.join(__dirname, "downloads")
								if (!fs.existsSync(downloadDir)) {
									fs.mkdirSync(downloadDir)
								}

								const filePath = path.join(downloadDir, `photo_${userId}.jpg`)

								// Скачивание файла с использованием axios
								axios({
									method: "get",
									url: fileUrl,
									responseType: "stream",
								}).then((response) => {
									response.data.pipe(fs.createWriteStream(filePath))

									response.data.on("end", () => {
										console.log("Файл сохранен на сервере:", filePath)

										// Теперь у вас есть фактический файл на сервере
										// Сохраните путь к файлу в базе данных
										User.findOne({ where: { userId: userId.toString() } })
											.then((user) => {
												if (user) {
													// Если пользователь существует, обновите его путь к файлу в базе данных
													user
														.update({ filePath: filePath })
														.then(() => {
															console.log(
																"Путь к файлу пользователя успешно обновлен в базе данных."
															)
														})
														.catch((error) => {
															console.error(
																"Ошибка при обновлении пути к файлу пользователя:",
																error
															)
														})
												} else {
													// Если пользователь не существует, создайте новую запись с путем к файлу
													User.create({
														userId: userId.toString(),
														filePath: filePath,
													})
														.then(() => {
															console.log(
																"Новый пользователь с путем к файлу успешно создан в базе данных."
															)
														})
														.catch((error) => {
															console.error(
																"Ошибка при создании нового пользователя с путем к файлу:",
																error
															)
														})
												}
											})
											.catch((error) => {
												console.error(
													"Ошибка при поиске пользователя в базе данных:",
													error
												)
											})
									})

									response.data.on("error", (error) => {
										console.error("Ошибка при скачивании файла:", error)
									})
								})
							})
							.catch((error) => {
								console.error("Ошибка при получении информации о файле:", error)
							})
					} else {
						console.error(
							"Пользователь не имеет фотографий профиля для команды."
						)
					}
				})
				.catch((error) => {
					console.error(
						"Ошибка при получении изображения профиля для команды",
						error
					)
				})
		}
	})

	app.get("/customer/settings/client/photo/:userId", (req, res) => {
		const userId = req.params.userId

		// Получите путь к фотографии из базы данных
		User.findOne({ where: { userId } })
			.then((user) => {
				if (user && user.filePath) {
					const filePath = user.filePath

					// Отправьте фотографию как ответ на запрос, используя только относительный путь
					res.sendFile(filePath)
				} else {
					res.status(404).send("Фотография не найдена")
				}
			})
			.catch((error) => {
				console.error("Ошибка при поиске пути к фотографии:", error)
				res.status(500).send("Ошибка сервера")
			})
	})

	app.get("/customer/photo/:userId", (req, res) => {
		const userId = req.params.userId
		const baseUrl = `https://cdn.zipperconnect.space/customer/settings/client/photo/${userId}`
		// Получите путь к фотографии из базы данных
		User.findOne({ where: { userId } })
			.then((user) => {
				if (user && user.filePath) {
					const filePath = user.filePath

					// Создайте полный URL пути к фотографии
					const fullUrl = `${baseUrl}`

					// Отправьте фотографию как ответ на запрос с полным URL
					res.json({ userId: userId, img: fullUrl })
				} else {
					res.status(404).send("Фотография не найдена")
				}
			})
			.catch((error) => {
				console.error("Ошибка при поиске пути к фотографии:", error)
				res.status(500).send("Ошибка сервера")
			})
	})

	app.get("/userProfile/:userId", (req, res) => {
		const userId = req.params.userId // Получите userId из параметров запроса

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
					})
				} else {
					res.status(404).json({ error: "Пользователь не найден" })
				}
			})
			.catch((error) => {
				console.error("Ошибка при поиске пользователя:", error)
				res.status(500).json({ error: "Внутренняя ошибка сервера" })
			})
	})

	app.post("/customer/settings/client", async (req, res) => {
		const { userId, fullName, userPhone, address, userCity } = req.body

		try {
			// Ищем пользователя по userId
			const user = await User.findOne({ where: { userId } })

			if (user) {
				// Если пользователь существует, обновляем его данные
				await user.update({
					userFio: fullName,
					phoneNumber: userPhone,
					userAdress: address,
					userCity: userCity,
					// Другие поля, которые вы хотите обновить
				})
				console.log("Данные пользователя успешно обновлены.")
			} else {
				// Если пользователь не существует, создаем нового пользователя
				const newUser = {
					userId,
					userFio: fullName,
					phoneNumber: userPhone,
					userAdress: address,
					userCity: userCity,
					// Другие поля, которые вы хотите сохранить
				}
				await User.create(newUser)
				console.log("Новый пользователь успешно создан.")
			}

			return res.status(200).json({ message: "Данные успешно сохранены" })
		} catch (error) {
			console.error("Ошибка при обновлении данных:", error)
			return res.status(500).json({ message: "Ошибка при обновлении данных" })
		}
	})

	app.get("/customer/settings/client/:userId", async (req, res) => {
		const userId = req.params.userId

		try {
			// Здесь используйте ваш метод или ORM для поиска пользователя по userId
			const user = await User.findOne({ where: { userId } })

			if (user) {
				// Если пользователь найден, получите userAdress и userFio из базы данных
				const phoneNumber = user.phoneNumber
				const userFio = user.userFio
				const userAdress = user.userAdress
				const userCity = user.userCity

				// Отправьте userAdress и userFio на клиентскую сторону
				res.json({
					userId,
					phoneNumber,
					userFio,
					userAdress,
					userCity,
				})
			} else {
				res.status(404).json({ message: "Пользователь не найден" })
			}
		} catch (error) {
			console.error("Ошибка при запросе данных из базы данных:", error)
			res.status(500).json({ message: "Внутренняя ошибка сервера" })
		}
	})

	const PORT = 8000

	app.listen(PORT, () => {
		console.log(`Server started on PORT ${PORT}`)
	})
