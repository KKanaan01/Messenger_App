const router = require('express').Router();
const { createConversation } = require('../controllers/conversation');

router.post('/createConversation' , createConversation);

module.exports = router;