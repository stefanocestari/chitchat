module.exports = mongoose => {
    const ChatMessage = mongoose.model(
      "chatMessage",
      mongoose.Schema(
        {
          user: {
            name : String 
          },
          text: String,
          room: String
        },
        { timestamps: true }
      )
    );
  
    return ChatMessage;
  };