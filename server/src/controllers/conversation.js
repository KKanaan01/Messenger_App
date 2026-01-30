const Conversation = require('../models/conversation');

// #region Mongo Query Operators Cheat Sheet

/*
$all  → array must contain ALL values
$in   → array contains ANY value
$or   → logical OR
$and  → logical AND
$gt   → greater than
$lt   → less than
$regex → text search
$exists → field exists check
$size → array length match
*/

/*
========= BASIC MATCH =========

// equal
Model.find({ age: 25 })

// not equal
Model.find({ age: { $ne: 25 } })

// greater / less than
Model.find({ age: { $gt: 18 } })
Model.find({ age: { $lt: 65 } })


========= LOGICAL =========

// OR
Model.find({
  $or: [{ role: "admin" }, { role: "moderator" }]
})

// AND
Model.find({
  $and: [{ age: { $gt: 18 } }, { verified: true }]
})


========= ARRAYS (CHAT APP USEFUL) =========

// contains value
Model.find({ members: userId })

// contains ANY
Model.find({ members: { $in: [id1, id2] } })

// contains ALL (used for conversations)
Model.find({ members: { $all: [id1, id2] } })

// array size
Model.find({ members: { $size: 2 } })


========= TEXT SEARCH =========

// case-insensitive search
Model.find({
  username: { $regex: "john", $options: "i" }
})


========= EXISTENCE =========

// field exists
Model.find({ avatar: { $exists: true } })

// field missing
Model.find({ avatar: { $exists: false } })

*/

// #endregion


// ONE ON ONE conversation method
export const createConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const desiredUserId = req.body.userId;

        if (!desiredUserId) return res.status(400).json({ message: "Invalid user" });

        if (userId === desiredUserId) return res.status(400).json({ message: "Cannot create chat with self." });

        const existingConversation = await Conversation.findOne({
            members: { $all: [userId, desiredUserId] },
            isGroup: false
        });

        if (existingConversation) {
            return res.status(200).json({
                chat: {
                    id: existingConversation._id,
                    isGroup: existingConversation.isGroup,
                    members: existingConversation.members,
                    createdAt: existingConversation.createdAt
                }
            });
        } else {
            const chat = await Conversation.create({
                members: [userId, desiredUserId]
            });

            return res.status(201).json({
                chat: { id: chat._id, isGroup: chat.isGroup, members: chat.members, createdAt: chat.createdAt }
            });
        }
    } catch (err) {
        console.error('Something went wrong: ' + err);
        res.status(500).json({ message: "Server error" });
    }
}