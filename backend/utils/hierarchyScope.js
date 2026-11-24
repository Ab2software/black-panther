const mongoose = require("mongoose");
const User = require("../model/User");

async function getScopedUserIds(actor) {
  if (!actor) return [];

  if (actor.role === "owner") {
    return null;
  }

  const actorId = new mongoose.Types.ObjectId(actor._id);

  // Walk descendants via parentId (any depth)
  const [parentTree] = await User.aggregate([
    { $match: { _id: actorId } },
    {
      $graphLookup: {
        from: "users",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "parentId",
        as: "descendants",
        maxDepth: 15,
      },
    },
    { $project: { descendants: 1, _id: 0 } },
  ]);

  // Walk descendants via createdBy (any depth) — separate tree walk
  // in case createdBy is the field actually populated at creation time
  const [createdByTree] = await User.aggregate([
    { $match: { _id: actorId } },
    {
      $graphLookup: {
        from: "users",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "createdBy",
        as: "descendants",
        maxDepth: 15,
      },
    },
    { $project: { descendants: 1, _id: 0 } },
  ]);

  const parentDescendants = parentTree?.descendants || [];
  const createdByDescendants = createdByTree?.descendants || [];

  const allDescendants = [...parentDescendants, ...createdByDescendants];
  const descendantIds = allDescendants.map((d) => d._id);

  const treeUserIds = allDescendants
    .filter((d) => d.role === "user")
    .map((d) => d._id);

  // Direct assignedAdmin match against actor + any admin-like descendant
  const adminLikeIds = [actorId, ...descendantIds];
  const assignedUsers = await User.find(
    { assignedAdmin: { $in: adminLikeIds }, role: "user" },
    { _id: 1 }
  ).lean();

  const assignedUserIds = assignedUsers.map((u) => u._id);

  const allIds = [...treeUserIds, ...assignedUserIds];
  const uniqueIds = [
    ...new Map(allIds.map((id) => [id.toString(), id])).values(),
  ];

  console.log(`[getScopedUserIds] actor=${actor.username} (${actor.role}) resolved ${uniqueIds.length} user(s)`);

  return uniqueIds;
}

module.exports = { getScopedUserIds };