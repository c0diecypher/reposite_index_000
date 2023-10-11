const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    'zipperconnect',
    'gen_user',
    '&=6_L1[1nktPv<',
    {
    host: '81.200.153.83',
    port: 5432,
    dialect: 'postgres'
    }
)

module.exports = sequelize;
