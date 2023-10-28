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
  filePath: {
    type: DataTypes.STRING, // Поле для хранения ссылки на фото
  },
});

User.sync({ force: false });

module.exports = User;
