const bcrypt = require("bcryptjs");
const User = require("../../model/User");

// ─────────────────────────────────────────────
// CREATE a new sub-admin
// POST /api/v1/admin/subadmins
// ─────────────────────────────────────────────
const createSubAdmin = async (req, res) => {
  try {
    const { username, password, fullName, email, phone } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password are required." });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(400).json({ success: false, message: "Username already taken." });
    }

    const subAdmin = await User.create({
      username,
      password,
      fullName: fullName || "",
      email: email || "",
      phone: phone || "",
      role: "admin",
      adminStatus: "inactive", // superadmin must explicitly activate
      createdBy: req.admin._id,
    });

    return res.status(201).json({
      success: true,
      message: "Sub-admin created successfully.",
      data: {
        _id: subAdmin._id,
        username: subAdmin.username,
        fullName: subAdmin.fullName,
        email: subAdmin.email,
        phone: subAdmin.phone,
        role: subAdmin.role,
        adminStatus: subAdmin.adminStatus,
        createdAt: subAdmin.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET all sub-admins (role === "admin") created by THIS superadmin
// GET /api/v1/admin/subadmins
// ─────────────────────────────────────────────
const getAllSubAdmins = async (req, res) => {
  try {
    const subAdmins = await User.find({ role: "admin", createdBy: req.admin._id })
      .select("username fullName email phone adminStatus status role createdAt createdBy")
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    const withCounts = await Promise.all(
      subAdmins.map(async (admin) => {
        const userCount = await User.countDocuments({
          assignedAdmin: admin._id,
          role: "user",
        });
        return { ...admin.toObject(), userCount };
      })
    );

    return res.status(200).json({ success: true, data: withCounts });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// ─────────────────────────────────────────────
// GET single sub-admin by ID (must belong to THIS superadmin)
// GET /api/v1/admin/subadmins/:id
// ─────────────────────────────────────────────
const getSubAdminById = async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      role: "admin",
      createdBy: req.admin._id,
    }).select("-password");

    if (!admin) {
      return res.status(404).json({ success: false, message: "Sub-admin not found." });
    }

    const userCount = await User.countDocuments({ assignedAdmin: admin._id, role: "user" });

    return res.status(200).json({ success: true, data: { ...admin.toObject(), userCount } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// ─────────────────────────────────────────────
// ACTIVATE a sub-admin
// PATCH /api/v1/admin/subadmins/:id/activate
//
// Business rule: only ONE admin can be active at a time, PER SUPERADMIN.
// Activating a new one deactivates all others *belonging to this same
// superadmin* — not every admin in the whole database.
// ─────────────────────────────────────────────
const activateSubAdmin = async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      role: "admin",
      createdBy: req.admin._id,
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Sub-admin not found." });
    }

    // Deactivate all other admins belonging to THIS superadmin, so only
    // one is ever active within their own hierarchy.
    await User.updateMany(
      {
        role: "admin",
        adminStatus: "active",
        createdBy: req.admin._id,
        _id: { $ne: admin._id },
      },
      { $set: { adminStatus: "inactive" } }
    );

    admin.adminStatus = "active";
    await admin.save();

    return res.status(200).json({
      success: true,
      message: `Sub-admin "${admin.username}" activated.`,
      data: { _id: admin._id, adminStatus: admin.adminStatus },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// ─────────────────────────────────────────────
// DEACTIVATE a sub-admin
// PATCH /api/v1/admin/subadmins/:id/deactivate
// ─────────────────────────────────────────────
const deactivateSubAdmin = async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      role: "admin",
      createdBy: req.admin._id,
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Sub-admin not found." });
    }

    admin.adminStatus = "inactive";
    await admin.save();

    return res.status(200).json({
      success: true,
      message: `Sub-admin "${admin.username}" deactivated.`,
      data: { _id: admin._id, adminStatus: admin.adminStatus },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// ─────────────────────────────────────────────
// DELETE a sub-admin (must belong to THIS superadmin)
// DELETE /api/v1/admin/subadmins/:id
// ─────────────────────────────────────────────
const deleteSubAdmin = async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      role: "admin",
      createdBy: req.admin._id,
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: "Sub-admin not found." });
    }

    // Unassign all users that were under this admin
    await User.updateMany(
      { assignedAdmin: admin._id },
      { $set: { assignedAdmin: null } }
    );

    await User.deleteOne({ _id: admin._id });

    return res.status(200).json({
      success: true,
      message: `Sub-admin "${admin.username}" deleted. Their users have been unassigned.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// ─────────────────────────────────────────────
// REASSIGN a user from one admin to another
// Both the current owner and the target admin must belong to THIS
// superadmin's own hierarchy (either be req.admin themself, or one of
// req.admin's sub-admins).
// PATCH /api/v1/admin/subadmins/reassign-user
// Body: { userId, newAdminId }
// ─────────────────────────────────────────────
const reassignUser = async (req, res) => {
  try {
    const { userId, newAdminId } = req.body;

    if (!userId || !newAdminId) {
      return res.status(400).json({ success: false, message: "userId and newAdminId are required." });
    }

    const user = await User.findOne({ _id: userId, role: "user" });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // The user's current owner must be req.admin themself, or a
    // sub-admin created by req.admin.
    const isOwnedBySelf = String(user.assignedAdmin) === String(req.admin._id);
    let isOwnedBySubAdmin = false;
    if (!isOwnedBySelf && user.assignedAdmin) {
      const currentOwner = await User.findOne({
        _id: user.assignedAdmin,
        createdBy: req.admin._id,
        role: "admin",
      });
      isOwnedBySubAdmin = !!currentOwner;
    }

    if (!isOwnedBySelf && !isOwnedBySubAdmin) {
      return res.status(403).json({ success: false, message: "This user is not in your scope." });
    }

    // Target admin: either req.admin themself, or one of req.admin's sub-admins
    let newAdmin = null;
    if (String(newAdminId) === String(req.admin._id)) {
      newAdmin = req.admin;
    } else {
      newAdmin = await User.findOne({
        _id: newAdminId,
        role: "admin",
        createdBy: req.admin._id,
      });
    }

    if (!newAdmin) {
      return res.status(404).json({ success: false, message: "Target admin not found." });
    }

    const oldAdminId = user.assignedAdmin;
    user.assignedAdmin = newAdminId;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User "${user.username}" reassigned to admin "${newAdmin.username}".`,
      data: {
        userId: user._id,
        oldAdminId,
        newAdminId,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

module.exports = {
  createSubAdmin,
  getAllSubAdmins,
  getSubAdminById,
  activateSubAdmin,
  deactivateSubAdmin,
  deleteSubAdmin,
  reassignUser,
};