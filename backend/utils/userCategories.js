import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

async function getUserCategoryAnalysis() {
  const userStats = await Transaction.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $group: {
        _id: "$userDetails.userType",
        totalBorrows: { $sum: 1 },
        avgBorrowDuration: {
          $avg: {
            $cond: [
              { $ne: ["$returnDate", null] },
              {
                $divide: [
                  { $subtract: ["$returnDate", "$borrowDate"] },
                  24 * 60 * 60 * 1000,
                ],
              },
              null,
            ],
          },
        },
        activeBorrows: {
          $sum: {
            $cond: [{ $eq: ["$status", "borrowed"] }, 1, 0],
          },
        },
        overdueBorrows: {
          $sum: {
            $cond: [{ $eq: ["$status", "overdue"] }, 1, 0],
          },
        },
      },
    },
    {
      $sort: { totalBorrows: -1 },
    },
  ]);

  // Get user counts per type
  const userCounts = await User.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$userType",
        userCount: { $sum: 1 },
      },
    },
  ]);

  // Combine the data
  const result = userStats.map((stat) => {
    const userCount = userCounts.find((uc) => uc._id === stat._id);
    return {
      userType: stat._id,
      totalBorrows: stat.totalBorrows,
      avgBorrowDuration: stat.avgBorrowDuration || 0,
      activeBorrows: stat.activeBorrows,
      overdueBorrows: stat.overdueBorrows,
      userCount: userCount ? userCount.userCount : 0,
    };
  });

  return result;
}

export default getUserCategoryAnalysis;
