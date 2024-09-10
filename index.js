// index.js
const express = require('express');
const sequelize = require('./db');
const Url = require('./models/Url');
const Links = require('./models/Links')
const ListsLinks = require('./models/ListsLinks');
const Clipboard = require('./models/Clipboard');
const { Op } = require('sequelize');
const cors = require('cors'); // Import the cors package
const app = express();

// Configurer CORS
const corsOptions = {
  origin: 'https://front-shor-link.vercel.app', // Remplacez par l'URL de votre front-end
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Méthodes HTTP autorisées
  allowedHeaders: ['Content-Type', 'Authorization'] // En-têtes autorisés
};

app.use(cors(corsOptions));

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
// Check if short URL already exists and generate a unique one
async function getUniqueShortLinks() {
    let shortUrl = generateShortUrl();
    let exists = true;

    while (exists) {
        exists = await Links.findOne({ where: { short_link: shortUrl } });

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
    const { urls, customShortLink } = req.body;

    if (urls.length > 50) {
        return res.status(400).json({ message: 'Cannot exceed 50 URLs.' });
    }

    try {
        // Generate or use custom short link
        let shortLink = customShortLink || await getUniqueShortLinks();

        // Check if custom short link is already in use
        if (customShortLink) {
            const existingLink = await Links.findOne({ where: { short_link: customShortLink } });
            if (existingLink) {
                return res.status(400).json({ message: 'Custom short link already in use.' });
            }
        }

        // Create entry in the Links table
        const linkEntry = await Links.create({ short_link: shortLink });

        // Save URLs and titles in ListsLinks table
        for (let item of urls) {
            await ListsLinks.create({
                title: item.title,
                description: item.description || '',
                url: item.url,
                id_links: linkEntry.id
            });
        }

        res.json({ shortLink });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});



// 4. Get Link List
app.get('/linklist/:short_link', async (req, res) => {
    const { short_link } = req.params;

    try {
        const link = await Links.findOne({ 
            where: { short_link: short_link }, 
            include: [ListsLinks] // Use the correct model name
        });

        if (!link) {
            return res.status(404).json({ message: 'Short link not found' });
        }

        res.json({ urls: link.ListsLinks });
    } catch (error) {
        console.error('Error fetching short link:', error); // Log the actual error
        res.status(500).json({ message: 'Server error', error: error.message });
    }
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
