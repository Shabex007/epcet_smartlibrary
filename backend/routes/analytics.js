import express from "express";
import Transaction from "../models/Transaction.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import getMostBorrowedBooks from "../utils/mostBorrowed.js";
import getReadingPatterns from "../utils/readingPatterns.js";
import getUserCategoryAnalysis from "../utils/userCategories.js";

const router = express.Router();

// GET /api/analytics/most-borrowed - Most borrowed books
router.get("/most-borrowed", async (req, res) => {
  try {
    const { limit = 10, period = "all" } = req.query;

    const mostBorrowed = await getMostBorrowedBooks(parseInt(limit), period);

    res.json({
      success: true,
      data: mostBorrowed,
      period,
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Error in most-borrowed analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch analytics",
    });
  }
});

// GET /api/analytics/user-categories - User category analysis
router.get("/user-categories", async (req, res) => {
  try {
    const userAnalysis = await getUserCategoryAnalysis();

    res.json({
      success: true,
      data: userAnalysis,
    });
  } catch (error) {
    console.error("Error in user categories analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user analytics",
    });
  }
});

// GET /api/analytics/reading-patterns - Reading patterns analysis
router.get("/reading-patterns", async (req, res) => {
  try {
    const patterns = await getReadingPatterns();
    res.json({
      success: true,
      data: patterns,
    });
  } catch (error) {
    console.error("Error in reading patterns analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reading patterns",
    });
  }
});

// GET /api/analytics/dashboard - Dashboard statistics
router.get("/dashboard", async (req, res) => {
  try {
    const [
      totalBooks,
      totalUsers,
      activeBorrows,
      totalTransactions,
      overdueBooks,
      availableBooks,
    ] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments({ isActive: true }),
      Transaction.countDocuments({ status: "borrowed" }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: "overdue" }),
      Book.countDocuments({ availableCopies: { $gt: 0 } }),
    ]);

    const popularCategories = await Transaction.aggregate([
      {
        $lookup: {
          from: "books",
          localField: "bookId",
          foreignField: "_id",
          as: "book",
        },
      },
      {
        $group: {
          _id: { $arrayElemAt: ["$book.category", 0] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const userTypeStats = await Transaction.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $group: {
          _id: { $arrayElemAt: ["$user.userType", 0] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Calculate monthly trends
    const monthlyTrends = await Transaction.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$borrowDate" },
            month: { $month: "$borrowDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalBooks,
          availableBooks,
          totalUsers,
          activeBorrows,
          totalTransactions,
          overdueBooks,
        },
        popularCategories,
        userTypeStats,
        monthlyTrends,
      },
    });
  } catch (error) {
    console.error("Error in dashboard analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard stats",
    });
  }
});

// GET /api/analytics/monthly-report - Monthly borrowing report
router.get("/monthly-report", async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const monthlyReport = await Transaction.aggregate([
      {
        $match: {
          borrowDate: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${parseInt(year) + 1}-01-01`),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$borrowDate" },
            month: { $month: "$borrowDate" },
          },
          totalBorrows: { $sum: 1 },
          totalReturns: {
            $sum: { $cond: [{ $eq: ["$status", "returned"] }, 1, 0] },
          },
          totalOverdue: {
            $sum: { $cond: [{ $eq: ["$status", "overdue"] }, 1, 0] },
          },
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
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $project: {
          year: "$_id.year",
          month: "$_id.month",
          totalBorrows: 1,
          totalReturns: 1,
          totalOverdue: 1,
          avgBorrowDuration: { $round: ["$avgBorrowDuration", 2] },
        },
      },
    ]);

    res.json({
      success: true,
      data: monthlyReport,
      year: parseInt(year),
    });
  } catch (error) {
    console.error("Error in monthly report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate monthly report",
    });
  }
});

export default router;
