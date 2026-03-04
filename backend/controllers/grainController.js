const pool = require('../db');

// 1. ADD A NEW CROP (For Farmers)
const addGrain = async (req, res) => {
    try {
        // Get the data sent from the React form
        const { farmer_id, crop_name, quantity, asking_price, location } = req.body;

        const newGrain = await pool.query(
            "INSERT INTO grains (farmer_id, crop_name, quantity, asking_price, location) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [farmer_id, crop_name, quantity, asking_price, location || 'India']
        );

        res.status(201).json({ message: "Crop listed successfully!", grain: newGrain.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to add crop" });
    }
};

// 2. FETCH ALL CROPS (For Buyers)
const getAllGrains = async (req, res) => {
    try {
        // We use a SQL 'JOIN' here to combine the grains table with the users table
        // This way, the buyer can see the farmer's name and contact number!
        const query = `
            SELECT g.*, u.full_name as farmer_name, u.email_or_phone as contact
            FROM grains g
            JOIN users u ON g.farmer_id = u.id
            WHERE g.is_active = TRUE
            ORDER BY g.created_at DESC;
        `;
        const allGrains = await pool.query(query);
        res.json(allGrains.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to fetch marketplace" });
    }
};

module.exports = { addGrain, getAllGrains };