const User = require("../models/User");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user } }).select("-password");

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
};