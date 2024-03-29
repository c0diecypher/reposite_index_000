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
    type: DataTypes.TEXT,
    allowNull: true,
    unique: false, // Измененное значение
  },
  userRank: {
    type: DataTypes.TEXT,
    allowNull: true,
    unique: false, // Измененное значение
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
  referralId: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
   startBonus: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

User.sync({ force: false });

module.exports = User;
