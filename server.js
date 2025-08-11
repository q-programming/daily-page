const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// AccuWeather API proxy endpoints
app.get('/api/accuweather/*', async (req, res) => {
    try {
        const endpoint = req.path.replace('/api/accuweather/', '');
        const queryString = new URLSearchParams(req.query).toString();
        const url = `https://dataservice.accuweather.com/${endpoint}?${queryString}`;

        console.log(`Proxying request to: ${url}`);

        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('AccuWeather API error:', error.message);
        if (error.response) {
            res.status(error.response.status).json({
                error: error.message,
                details: error.response.data,
            });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// IQAir API proxy endpoint
app.get('/api/airquality/*', async (req, res) => {
    try {
        const endpoint = req.path.replace('/api/airquality/', '');
        const queryString = new URLSearchParams(req.query).toString();
        const url = `https://api.airvisual.com/${endpoint}?${queryString}`;

        console.log(`Proxying request to: ${url}`);

        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error('IQAir API error:', error.message);
        if (error.response) {
            res.status(error.response.status).json({
                error: error.message,
                details: error.response.data,
            });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Serve index.html for all routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
