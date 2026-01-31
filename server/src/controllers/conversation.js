const Conversation = require('../models/conversation');
const mongoose = require("mongoose");

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

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const desiredUserId = req.body.userId;
        const groupMembers = req.body.userIds;
        const name = req.body.name;

        if (Array.isArray(groupMembers)) {
            if (!name) {
                return res.status(400).json({ message: "Group name is required" });
            }

            if (groupMembers.length < 2) {
                return res
                    .status(400)
                    .json({ message: "Group chat needs at least 2 users" });
            }

            if (!isValidId(userId) || !groupMembers.every(isValidId)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }

            const finalGroupMembers = [...new Set([userId, ...groupMembers])];

            let groupChat = await Conversation.create({
                name: name,
                members: finalGroupMembers,
                isGroup: true,
                admin: userId
            });

            groupChat = await groupChat.populate(
                "members admin",
                "username"
            );

            return res.status(201).json({
                chat: { id: groupChat._id, isGroup: groupChat.isGroup, members: groupChat.members, createdAt: groupChat.createdAt }
            });

        } else if (desiredUserId) {

            if (!isValidId(userId) || !isValidId(desiredUserId)) {
                return res.status(400).json({ message: "Invalid user ID" });
            }

            if (userId === desiredUserId) return res.status(400).json({ message: "Cannot create chat with self." });

            const existingConversation = await Conversation.findOne({
                members: { $all: [userId, desiredUserId] },
                isGroup: false
            }).populate("members" , "username");

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
                let chat = await Conversation.create({
                    members: [userId, desiredUserId]
                });

                chat = await chat.populate("members", "username");

                return res.status(201).json({
                    chat: { id: chat._id, isGroup: chat.isGroup, members: chat.members, createdAt: chat.createdAt }
                });
            }
        } else {
            return res.status(400).json({ message: "Invalid Payload" });
        }
    } catch (err) {
        console.error('Something went wrong: ' + err);
        res.status(500).json({ message: "Server error" });
    }
}