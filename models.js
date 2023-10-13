const sequelize = require('./database');
const {DataTypes} = require('sequelize')
const User = sequelize.define('user',{

    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        allowNull: false,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    first_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    });

    User.checkAndCreateUser = async (userData) => {
    const { id } = userData;

    try {
        const existingUser = await User.findOne({
            where: { id },
        });

        if (existingUser) {
            // Пользователь с данным id уже существует, не создаем новую запись
            return existingUser;
        } else {
            // Создаем новую запись
            const newUser = await User.create(userData);
            return newUser;
        }
    } catch (error) {
        throw error;
    }
};

module.exports = User; 
