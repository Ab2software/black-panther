const User = require("../model/User");

const generateUniqueProviderId = async () => {
  while (true) {
    const id = Math.floor(100000000 + Math.random() * 900000000);

    const exists = await User.findOne({ providerUserId: id });

    if (!exists) return id;
  }
};

module.exports = generateUniqueProviderId;