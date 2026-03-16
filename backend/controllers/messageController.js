const Message = require("../models/Message");
const User = require("../models/User");

const sendMessage = async (req, res) => {
  try {
    const { receiverId, text } = req.body;

    if (!receiverId || !text) {
      return res.status(400).json({ message: "receiverId and text are required" });
    }

    const receiverExists = await User.findById(receiverId);

    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    const message = await Message.create({
      senderId: req.user,
      receiverId,
      text,
    });

    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({
      message: "Server error while sending message",
      error: error.message,
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { receiverId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: req.user, receiverId: receiverId },
        { senderId: receiverId, receiverId: req.user },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching messages",
      error: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
};