const sequelize = require('./database');
const { DataTypes } = require('sequelize');

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  first_name: {
    type: DataTypes.STRING,
    allowNull: true, // Разрешить значение быть null, если данные не доступны
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: true, // Разрешить значение быть null, если данные не доступны
  },
  phoneNumber: {
    type: DataTypes.STRING, 
    allowNull: true,
    unique: true,
  },
  tgPhoneNumber: {
    type: DataTypes.STRING, 
    allowNull: true,
    unique: true,
  },
  userAdress: {
    type: DataTypes.STRING,
    allowNull: true, // Разрешить значение быть null, если данные не доступны
  },
  userFio: {
    type: DataTypes.STRING,
    allowNull: true, // Разрешить значение быть null, если данные не доступны
  },
   userCity: {
    type: DataTypes.STRING, 
    allowNull: true,
    unique: true,
  },
  userDelivery: {
    type: DataTypes.STRING, 
    allowNull: true,
    unique: true,
  },
  userOrder: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  referralLink: {
    type: DataTypes.STRING, 
    allowNull: true,
    unique: true,
  },
  latestOrders: {
    type: DataTypes.STRING, 
    allowNull: true,
    unique: true,
  },
  userBonus: {
    type: DataTypes.STRING, 
    allowNull: true,
    unique: true,
  },
  userRank: {
    type: DataTypes.STRING, 
    allowNull: true,
    unique: true,
  },
  userSplit: {
    type: DataTypes.STRING, 
    allowNull: true,
    unique: true,
  },
  filePath: {
    type: DataTypes.STRING, // Поле для хранения ссылки на фото
    allowNull: true,
    unique: true,
  },
});

User.sync({ force: false });

module.exports = User;
