const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/user');

const signToken = (userId) => {
  return jwt.sign(
    { sub: userId },               
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const handleRegister = async (req, res) => {
    try {
        const { firstName, lastName, username, password, email } = req.body;
        if ( !firstName || !lastName || !username || !password || !email) return res.status(400).json({ message: "Please fill out the required information." });

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email" });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        // allows us to filter to find the user
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { username }],
        });

        if (existingUser) {
            return res.status(409).json({ message: "Email or username already in use" });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await User.create({
            firstName,
            lastName,
            username: username.trim().toLowerCase(),
            email: email.toLowerCase(),
            passwordHash,
        });
        const token = signToken(user._id.toString());

        return res.status(201).json({
            token,
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}