const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const user = require('../models/user');

const handleLogin = async (req, res) => {
    const { user, password, email } = req.body;
    if (!user || !password || !email) return res.json(400).json({ 'message': "Please fill out the required information." });

    if (!validator.isEmail(email)) {
        return res.status(400).json({ message: "Invalid email" });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
}