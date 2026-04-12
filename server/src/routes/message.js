const router = require('express').Router();
const {createMessage , retrieveMessages, markAsSeen} = require('../controllers/message');
const verifyJwt = require('../middleware/verifyJwt');

router.post('/createMessage' , verifyJwt , createMessage);
router.get('/:conversationId' , verifyJwt , retrieveMessages);
router.patch('/:conversationId/seen', verifyJwt, markAsSeen);

module.exports = router;