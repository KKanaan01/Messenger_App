const jwt = require("jsonwebtoken");

const verifyJwt = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.sendStatus(401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.sub;

        return next();
    } catch (err) {
        return res.sendStatus(403);
    }
}

module.exports = verifyJwt;