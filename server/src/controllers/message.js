const Conversation = require('../models/conversation');
const Message = require('../models/message');
const mongoose = require('mongoose');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const createMessage = async (req, res) => {
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
            return res.status(404).json({ message: 'Conversation not found' });

        let newMessage = await Message.create({
            conversation: convo._id,
            sender: senderId,
            text: text.trim(),
            seenBy: [senderId]
        });

        await Conversation.findByIdAndUpdate(
            convo._id,
            {
                $set: { lastMessage: newMessage._id },
                $currentDate: { updatedAt: true }
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

const retrieveMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;

        if (!isValidId(conversationId)) {
            return res.status(400).json({ message: 'Invalid Conversation Id.' });
        }

        // This checks if the user making the request actually belongs to the conversation
        const conversation = Conversation.findOne({
            _id: conversationId,
            members: req.userId
        });

        if (!conversation)
            return res.status(403).json({ message: 'Access denied' });

        const messages = await Message.find({
            conversation: conversationId
        })
            .sort({ createdAt: 1 })
            .populate("sender", "firstName lastName username");

        return res.status(200).json({
            messages
        });

    } catch (err) {
        console.error("Something went wrong " + err);
        res.status(500).json({ message: 'Server error' });
    }
}

const markAsSeen = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.userId;

        if (!isValidId(conversationId))
            return res.status(400).json({ message: 'Invalid Conversation Id.' });

        const conversation = await Conversation.findOne({
            _id: conversationId,
            members: userId
        });

        if (!conversation)
            return res.status(403).json({ message: 'Access denied' });

        const result = await Message.updateMany(
            {
                conversation: conversationId,
                seenBy: { $ne: userId }
            },
            {
                $addToSet: { seenBy: userId }
            }
        );

        return res.status(200).json({
            message: "Messages marked as seen",
            modifiedCount: result.modifiedCount
        });

    } catch (err) {
        console.error("Something went wrong " + err);
        res.status(500).json({ message: 'Server error' });
    }
}

module.exports ={
    createMessage,
    retrieveMessages,
    markAsSeen
}