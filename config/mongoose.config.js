const mongoose = require('mongoose');
const MONGO_URI = require('./env.config').MONGO_URI;

exports.connect = async() => {
    mongoose.connect(MONGO_URI);
    const db = mongoose.connection;

    db.on("error", () => {
        console.log("could not connect");
    });

    db.once("open", () => {
        console.log("Successfully connected to database");
    });
}