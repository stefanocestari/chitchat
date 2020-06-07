module.exports = app => {
    const chatMessages = require("../controllers/chatMessages.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Tutorial
    router.post("/", chatMessages.create);
  
    // Retrieve all Tutorials
    router.get("/", chatMessages.findAll);
  
    // Retrieve all published Tutorials
    router.get("/published", chatMessages.findAllPublished);
  
    // Retrieve a single Tutorial with id
    router.get("/:id", chatMessages.findOne);
  
    // Update a Tutorial with id
    router.put("/:id", chatMessages.update);
  
    // Delete a Tutorial with id
    router.delete("/:id", chatMessages.delete);
  
    // Create a new Tutorial
    router.delete("/", chatMessages.deleteAll);
  
    app.use('/api/chatmessages', router);
  };