const sequelize = require('./database');
const {DataTypes} = require('sequelize')
const User = sequelize.define('user',{

    name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2), // Пример для цены, настройте тип данных по необходимости
        allowNull: false,
      },
      size: {
        type: DataTypes.DECIMAL(10, 2), // Пример для размера, настройте тип данных по необходимости
        allowNull: false,
      },
      phonenumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      chatId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      queryId: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
    });
    

module.exports = User; 
