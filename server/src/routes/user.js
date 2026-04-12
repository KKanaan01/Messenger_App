const router = require('express').Router();
const { searchUsers } = require('../controllers/user');
const verifyJwt = require('../middleware/verifyJwt');

router.get('/search', verifyJwt, searchUsers);

module.exports = router;