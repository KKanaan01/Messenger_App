const router = require('express').Router();
const { createConversation, getAllConversations } = require('../controllers/conversation');
const verifyJwt = require('../middleware/verifyJwt');

router.post('/createConversation' , verifyJwt, createConversation);
router.get('/getConversations' ,  verifyJwt ,getAllConversations);

module.exports = router;