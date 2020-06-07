const db = require("../models");
const ChatMessage = db.chatMessage;

// Create and Save a new Tutorial
exports.create = (req, res) => {
    console.log('req.body', req.body);
    if (!req.body.text) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
      }
    
      // Create a Tutorial
      const chatMessage = new ChatMessage({
        user:  req.body.user,
        text: req.body.text,
        room: req.body.room
      });
    
      // Save Tutorial in the database
      chatMessage
        .save(chatMessage)
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(500).send({
            message:
              err.message || "Some error occurred while creating the ChatMessage"
          });
        });
};

// Retrieve all Tutorials from the database.
exports.findAll = (req, res) => {
    const room = req.query.room;
    var condition = room ? { room: { $regex: new RegExp(room), $options: "i" } } : {};
  
    ChatMessage.find(condition)
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving chat messages."
        });
      });
  
};

// Find a single Tutorial with an id
exports.findOne = (req, res) => {
  
};

// Update a Tutorial by the id in the request
exports.update = (req, res) => {
  
};

// Delete a Tutorial with the specified id in the request
exports.delete = (req, res) => {
  
};

// Delete all Tutorials from the database.
exports.deleteAll = (req, res) => {
  
};

// Find all published Tutorials
exports.findAllPublished = (req, res) => {
  
};