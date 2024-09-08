// db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('m7008_shortlink', 'm7008_shortLinks', 'L22Lu20VB/"205u$niz4gwFN7NJmYd', {
    host: 'mysql11.serv00.com',
    port: 3306,
    dialect: 'mysql'
});

module.exports = sequelize;
