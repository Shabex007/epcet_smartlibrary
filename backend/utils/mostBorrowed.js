import Transaction from "../models/Transaction.js";

async function getMostBorrowedBooks(limit = 10, period = "all") {
  let dateFilter = {};

  if (period !== "all") {
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    dateFilter = { borrowDate: { $gte: startDate } };
  }

  return await Transaction.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$bookId",
        borrowCount: { $sum: 1 },
      },
    },
    { $sort: { borrowCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "books",
        localField: "_id",
        foreignField: "_id",
        as: "bookDetails",
      },
    },
    {
      $project: {
        title: { $arrayElemAt: ["$bookDetails.title", 0] },
        author: { $arrayElemAt: ["$bookDetails.author", 0] },
        category: { $arrayElemAt: ["$bookDetails.category", 0] },
        borrowCount: 1,
      },
    },
  ]);
}

export default getMostBorrowedBooks;
