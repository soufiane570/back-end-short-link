// db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('bdbyja22pgxfilp9iudf', 'u8cvp6arz0w5ioq8', 'WbB7ndYElZw30MVBnzFX', {
    host: 'bdbyja22pgxfilp9iudf-mysql.services.clever-cloud.com',
    dialect: 'mysql',
    logging: false,
});

module.exports = sequelize;
