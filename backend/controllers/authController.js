const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 1. REGISTER A NEW USER
const register = async (req, res) => {
    try {
        const { full_name, email_or_phone, password, role } = req.body;

        // Check if user already exists
        const userExists = await pool.query("SELECT * FROM users WHERE email_or_phone = $1", [email_or_phone]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Save user to database
        const newUser = await pool.query(
            "INSERT INTO users (full_name, email_or_phone, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, role",
            [full_name, email_or_phone, password_hash, role]
        );

        res.status(201).json({ message: "User registered successfully!", user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
};

// 2. LOGIN A USER
const login = async (req, res) => {
    try {
        const { email_or_phone, password } = req.body;

        // Find the user
        const user = await pool.query("SELECT * FROM users WHERE email_or_phone = $1", [email_or_phone]);
        if (user.rows.length === 0) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Generate a token (Your secret key should normally be in .env)
        const token = jwt.sign(
            { id: user.rows[0].id, role: user.rows[0].role },
            process.env.JWT_SECRET || "supersecretagrikey",
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login successful!",
            token,
            user: { id: user.rows[0].id, full_name: user.rows[0].full_name, role: user.rows[0].role }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server error" });
    }
};

module.exports = { register, login };