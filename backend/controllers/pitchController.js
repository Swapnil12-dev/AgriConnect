const pool = require('../db');

// 1. BUYER MAKES A PITCH
const makePitch = async (req, res) => {
    try {
        const { grain_id, buyer_id, pitch_amount } = req.body;
        const newPitch = await pool.query(
            "INSERT INTO pitches (grain_id, buyer_id, pitch_amount) VALUES ($1, $2, $3) RETURNING *",
            [grain_id, buyer_id, pitch_amount]
        );
        res.status(201).json({ message: "Pitch submitted successfully!", pitch: newPitch.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to submit pitch" });
    }
};

// 2. FARMER FETCHES INCOMING PITCHES
const getFarmerPitches = async (req, res) => {
    try {
        const { farmer_id } = req.params;
        const query = `
            SELECT p.*, g.crop_name, g.asking_price, u.full_name as buyer_name, u.email_or_phone as buyer_contact
            FROM pitches p
            JOIN grains g ON p.grain_id = g.id
            JOIN users u ON p.buyer_id = u.id
            WHERE g.farmer_id = $1
            ORDER BY p.created_at DESC;
        `;
        const pitches = await pool.query(query, [farmer_id]);
        res.json(pitches.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to fetch pitches" });
    }
};

// 3. BUYER FETCHES THEIR OWN PITCHES
const getBuyerPitches = async (req, res) => {
    try {
        const { buyer_id } = req.params;
        const query = `
            SELECT p.*, g.crop_name, u.full_name as farmer_name, u.email_or_phone as farmer_contact
            FROM pitches p
            JOIN grains g ON p.grain_id = g.id
            JOIN users u ON g.farmer_id = u.id
            WHERE p.buyer_id = $1
            ORDER BY p.created_at DESC;
        `;
        const pitches = await pool.query(query, [buyer_id]);
        res.json(pitches.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to fetch buyer pitches" });
    }
};

// 4. FARMER ACCEPTS OR REJECTS A PITCH
const updatePitchStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'
        const updatedPitch = await pool.query(
            "UPDATE pitches SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );
        res.json({ message: `Pitch ${status}!`, pitch: updatedPitch.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to update status" });
    }
};

// 5. BUYER DELETES A PITCH (To clean up their board)
const deletePitch = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM pitches WHERE id = $1", [id]);
        res.json({ message: "Pitch deleted successfully!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Failed to delete pitch" });
    }
};

// Update the exports at the very bottom to include deletePitch:
module.exports = { makePitch, getFarmerPitches, getBuyerPitches, updatePitchStatus, deletePitch };
