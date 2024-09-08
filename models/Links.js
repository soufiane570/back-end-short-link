// models/Links.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // Adjust path as needed

const Links = sequelize.define('Links', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    short_link: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
    }
}, {
    timestamps: false,
});

module.exports = Links;
