// sync.js or main server file
const sequelize = require('./db'); // Adjust path as needed
const Links = require('./models/Links');
const ListsLinks = require('./models/ListsLinks');

async function syncDatabase() {
    try {
        await sequelize.sync({ force: true }); // WARNING: This will drop tables and recreate them
        console.log('Database synchronized.');
    } catch (error) {
        console.error('Error synchronizing database:', error);
    }
}

syncDatabase();


