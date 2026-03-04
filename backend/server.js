const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors()); // Allows React to make requests to this backend
app.use(express.json()); // Allows us to accept JSON data in requests

const authRoutes = require('./routes/authRoutes');
const grainRoutes = require('./routes/grainRoutes');
const pitchRoutes = require('./routes/pitchRoutes');

// A simple test route to check if the database is connected
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ message: "PostgreSQL Connected Successfully!", time: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Database connection failed" });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/grains', grainRoutes);
app.use('/api/pitches', pitchRoutes)
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 