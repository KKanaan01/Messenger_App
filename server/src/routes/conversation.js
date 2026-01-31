const router = require('express').Router();
const { createConversation, getAllConversations } = require('../controllers/conversation');

router.post('/createConversation' , createConversation);
router.get('/getConversations' , getAllConversations);

module.exports = router;