const ccConfig = require("../config/cc.config.js");

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = ccConfig.mongo.url;
db.chatMessage = require("./cc.model.js")(mongoose);

module.exports = db;