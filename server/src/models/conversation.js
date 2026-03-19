const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: function () {
            return this.isGroup === true
        },
    },
    isGroup: {
        type: Boolean,
        default: false,
    },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    ],
    admin : {
        type: mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    lastMessage : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null
    }
} , { timestamps: true });

conversationSchema.index({ members: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);