const router = require('express').Router();
const {createMessage , retrieveMessages} = require('../controllers/message');
const verifyJwt = require('../middleware/verifyJwt');

router.post('/createMessage' , verifyJwt , createMessage);
router.get('/:conversationId' , verifyJwt , retrieveMessages);

module.exports = router;