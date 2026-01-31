// Setting up the app to run
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/auth" , require('./routes/auth'));
app.use("/api/chat" , require('./routes/conversation'));


app.get("/" , (req , res) => {
    res.send("API running!");
});

module.exports = app;