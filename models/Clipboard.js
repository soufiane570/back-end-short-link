const { DataTypes } = require('sequelize');
const sequelize = require('../db'); 

const Clipboard = sequelize.define('Clipboard', {
    clipboard_text: { type: DataTypes.TEXT, allowNull: false },
    clipboard_short_url: { type: DataTypes.STRING(10), allowNull: false, unique: true },
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Clipboard;