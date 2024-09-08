// index.js
const express = require('express');
const sequelize = require('./db');
const Url = require('./models/Url');
const LinksList = require('./models/ListsLinks');
const Clipboard = require('./models/Clipboard');
const { Op } = require('sequelize');
const cors = require('cors'); // Import the cors package
const app = express();
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

sequelize.sync();

// Utility function to generate a random short URL
function generateShortUrl() {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let shortUrl = '';
    for (let i = 0; i < 6; i++) {
        shortUrl += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return shortUrl;
}

// Check if short URL already exists and generate a unique one
async function getUniqueShortUrl() {
    let shortUrl = generateShortUrl();
    let exists = true;

    while (exists) {
        exists = await Url.findOne({ where: { short_url: shortUrl } });

        if (exists) {
            shortUrl = generateShortUrl(); // If exists, generate a new one
        } else {
            exists = false; // Unique short URL found
        }
    }

    return shortUrl;
}

// Validate the original URL format using regex
function validateUrl(url) {
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9\-_]+\.)+[a-zA-Z]{2,6}(\/.*)*\/?$/;
    return urlPattern.test(url);
}

// Calculate expiration date based on user input
function calculateExpirationDate(expiry) {
    const currentDate = new Date();
    switch (expiry) {
        case '1h':
            currentDate.setHours(currentDate.getHours() + 1);
            break;
        case '1d':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
        case '1w':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
        case '1m':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        case '1y':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
        case 'lifetime':
        default:
            return null; // No expiration
    }
    return currentDate;
}
// Routes

// 1. URL Shortener
// URL Shortener endpoint
app.post('/shorten', async (req, res) => {
    const { original_url, expiry } = req.body;

    try {
        // Validate the original URL
        if (!validateUrl(original_url)) {
            return res.status(400).json({ error: 'Invalid URL format. Please enter a valid URL.' });
        }

        // Get unique short URL
        const short_url = await getUniqueShortUrl();

        // Calculate expiration date
        const expiration_date = calculateExpirationDate(expiry);

        // Create the shortened URL record in the database
        const url = await Url.create({ original_url, short_url, expiration_date });

        // Respond with the generated short URL
        res.json({ short_url: url.short_url });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// 2. Redirect to original URL
app.get('/:short_url', async (req, res) => {
    const { short_url } = req.params;
    const url = await Url.findOne({ where: { [Op.or]: [{ short_url }, { custom_url: short_url }] } });

    if (!url) {
        return res.status(404).send('URL not found');
    }

    if (url.expiration_date && new Date(url.expiration_date) < new Date()) {
        return res.status(410).send('URL expired');
    }

    res.redirect(url.original_url);
});

// 3. Link List
app.post('/linklist', async (req, res) => {
    const { links } = req.body;

    try {
        const list_short_url = await getUniqueShortUrl();
        const linksList = await LinksList.create({ links, list_short_url });
        res.json({ list_short_url: linksList.list_short_url });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



// 4. Get Link List
app.get('/linklist/:list_short_url', async (req, res) => {
    const { list_short_url } = req.params;
    const list = await LinksList.findOne({ where: { list_short_url } });

    if (!list) {
        return res.status(404).send('List not found');
    }

    const links = list.links.split('\n').map(link => {
        const [url, title] = link.split(' ');
        return { url, title };
    });

    res.json(links);
});

// 5. Online Clipboard
app.post('/clipboard', async (req, res) => {
    const { clipboard_text } = req.body;

    try {
        const clipboard_short_url = await getUniqueShortUrl();
        const clipboard = await Clipboard.create({ clipboard_text, clipboard_short_url });
        res.json({ clipboard_short_url: clipboard.clipboard_short_url });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// 6. Get Clipboard Text
app.get('/clipboard/:clipboard_short_url', async (req, res) => {
    const { clipboard_short_url } = req.params;
    const clipboard = await Clipboard.findOne({ where: { clipboard_short_url } });

    if (!clipboard) {
        return res.status(404).send('Clipboard not found');
    }

    res.json({ clipboard_text: clipboard.clipboard_text , id : clipboard.id});
});
// 7. Update Clipboard Text
app.put('/clipboard/:clipboard_short_url', async (req, res) => {
    const { clipboard_short_url } = req.params;
    const { clipboard_text } = req.body;

    try {
        const clipboard = await Clipboard.findOne({ where: { clipboard_short_url } });

        if (!clipboard) {
            return res.status(404).send('Clipboard not found');
        }

        clipboard.clipboard_text = clipboard_text;
        await clipboard.save();

        res.json({ message: 'Clipboard updated successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Start server
app.listen(3001, () => {
    console.log('Server running on port 3001');
});
