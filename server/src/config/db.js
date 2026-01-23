const mongoose = require('mongoose');

async function connectDB() {

    const uri = process.env.DATABASE_URI;
    if (!uri) throw new Error("URI does not exist")

    mongoose.set("strictQuery" , true);

    await mongoose.connect(uri);
    console.log('Mongoose has successfully connected');
};

module.exports = connectDB;