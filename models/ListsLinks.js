// models/ListsLinks.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // Adjust path as needed
const Links = require('./Links'); // Adjust path as needed

const ListsLinks = sequelize.define('ListsLinks', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    id_links: {
        type: DataTypes.INTEGER,
        references: {
            model: Links,
            key: 'id',
        },
        allowNull: false,
    }
}, {
    timestamps: false,
});

// Set up associations
ListsLinks.belongsTo(Links, { foreignKey: 'id_links' });
Links.hasMany(ListsLinks, { foreignKey: 'id_links' });

module.exports = ListsLinks;
