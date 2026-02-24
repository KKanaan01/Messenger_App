import Conversation from '../models/conversation';
const Message = require('../models/message');
const mongoose = require('mongoose');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createMessage = async (req, res) => {
    try {
        const { conversationId, text } = req.body;
        const senderId = req.userId;

        if (!isValidId(conversationId)) 
            return res.status(400).json({ message: 'Invalid Conversation Id.' });

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: 'A text needs to be entered before sending message.'
            });
        }

        const convo = await Conversation.findOne({
            _id: conversationId,
            members: senderId
        });

        if (!convo)
            return res.status(404).json({message : 'Conversation not found'});

        let newMessage = await Message.create({
            conversation: convo._id,
            sender: senderId,
            text: text,
            seenBy: [senderId]
        });

        await Conversation.findByIdAndUpdate(
            convo._id,
            {
               $set: {lastMessage: newMessage._id}
            }
        );

        newMessage = await newMessage.populate(
            "sender",
            "firstName lastName username"
        )

        return res.status(201).json({
            message: newMessage
        });

    } catch (err) {
        console.error('Something went wrong: ' + err);
        res.status(500).json({ message: 'Server error' })
    }
}