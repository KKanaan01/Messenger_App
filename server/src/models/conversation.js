const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model("Conversation", conversationSchema);