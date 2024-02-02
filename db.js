require("dotenv").config()

const Pool = require("pg").Pool
const pool = new Pool({
	user: 'gen_user',
	password: '&=6_L1[1nktPv<',
	host: '81.200.153.83',
	port: 5432,
	database: 'zipperconnect',
})

module.exports = pool
