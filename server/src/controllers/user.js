const User = require('../models/user');

const searchUsers = async (req, res) => {
    try {
        const query = req.query.query;

        if (!query || !query.trim()) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: "i" } },
                { firstName: { $regex: query, $options: "i" } },
                { lastName: { $regex: query, $options: "i" } }
            ],
            _id: { $ne: req.userId } // exclude the logged in user
        }).select("_id username firstName lastName").limit(10);

        return res.status(200).json({ users });

    } catch (err) {
        console.error('Something went wrong: ' + err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { searchUsers };