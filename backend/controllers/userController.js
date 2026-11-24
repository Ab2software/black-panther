// controllers/userController.js
const User = require("../model/User");
const ADMIN_ROLES = ["admin", "superadmin", "owner"];


exports.getAssignedAdminContact = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

    const user = await User.findById(req.user.id)
      .select("assignedAdmin")
      .populate("assignedAdmin", "whatsapp username")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.assignedAdmin || !user.assignedAdmin.whatsapp) {
      return res.json({ success: true, data: { whatsapp: null } });
    }

    res.json({ success: true, data: { whatsapp: user.assignedAdmin.whatsapp } });
  } catch (err) {
    console.error("getAssignedAdminContact error:", err);
    res.status(500).json({ success: false, message: "Failed to load contact" });
  }
};


exports.updateUserWhatsapp = async (req, res) => {
  try {
    const { userId } = req.params;
    const { whatsapp } = req.body;

    if (!ADMIN_ROLES.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Admins only" });
    }

    // Only allow an admin to update their own number
    if (String(req.user.id) !== String(userId)) {
      return res.status(403).json({ success: false, message: "You can only update your own WhatsApp number" });
    }

    if (!whatsapp || !/^\d{10}$/.test(whatsapp)) {
      return res.status(400).json({ success: false, message: "Enter a valid 10-digit WhatsApp number" });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { whatsapp },
      { new: true, runValidators: true },
    ).select("whatsapp username");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.json({ success: true, data: { whatsapp: updated.whatsapp } });
  } catch (err) {
    console.error("updateUserWhatsapp error:", err);
    res.status(500).json({ success: false, message: "Failed to update WhatsApp number" });
  }
};

exports.getActiveAdminContact = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

    const activeAdmin = await User.findOne({
      role: { $in: ADMIN_ROLES },
      adminStatus: "active",
      whatsapp: { $exists: true, $ne: null, $ne: "" },
    })
      .select("whatsapp")
      .lean();

    if (!activeAdmin) {
      return res.json({ success: true, data: { whatsapp: null } });
    }

    res.json({ success: true, data: { whatsapp: activeAdmin.whatsapp } });
  } catch (err) {
    console.error("getActiveAdminContact error:", err);
    res.status(500).json({ success: false, message: "Failed to load contact" });
  }
};exports.getActiveAdminContact = async (req, res) => {
  try {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

    const activeAdmin = await User.findOne({
      role: { $in: ADMIN_ROLES },
      adminStatus: "active",
      whatsapp: { $exists: true, $ne: null, $ne: "" },
    })
      .select("whatsapp")
      .lean();

    if (!activeAdmin) {
      return res.json({ success: true, data: { whatsapp: null } });
    }

    res.json({ success: true, data: { whatsapp: activeAdmin.whatsapp } });
  } catch (err) {
    console.error("getActiveAdminContact error:", err);
    res.status(500).json({ success: false, message: "Failed to load contact" });
  }
};