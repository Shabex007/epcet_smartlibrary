import Transaction from "../models/Transaction.js";

async function getReadingPatterns() {
  return await Transaction.aggregate([
    { $match: { returnDate: { $ne: null } } },
    {
      $project: {
        borrowMonth: { $month: "$borrowDate" },
        borrowDayOfWeek: { $dayOfWeek: "$borrowDate" },
        durationDays: {
          $divide: [
            { $subtract: ["$returnDate", "$borrowDate"] },
            24 * 60 * 60 * 1000,
          ],
        },
      },
    },
    {
      $group: {
        _id: "$borrowMonth",
        averageBorrowDuration: { $avg: "$durationDays" },
        totalTransactions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export default getReadingPatterns;
