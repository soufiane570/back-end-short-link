// models/Url.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Url = sequelize.define('Url', {
    original_url: { type: DataTypes.TEXT, allowNull: false },
    short_url: { type: DataTypes.STRING(10), allowNull: false, unique: true },
    custom_url: { type: DataTypes.STRING(10), unique: true },
    expiration_date: { type: DataTypes.DATE },
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Url;
