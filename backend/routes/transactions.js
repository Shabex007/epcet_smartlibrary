import express from "express";
import Transaction from "../models/Transaction.js";
import Book from "../models/Book.js";
import User from "../models/User.js";
import transactionService from "../services/transactionService.js";

const router = express.Router();

// POST /api/transactions/borrow - Borrow a book
router.post("/borrow", async (req, res) => {
  try {
    const { bookId, userId, days = 14 } = req.body;

    console.log("Borrow request received:", { bookId, userId, days });

    // Validate input
    if (!bookId || !userId) {
      return res.status(400).json({
        success: false,
        error: "Book ID and User ID are required",
      });
    }

    // Use transaction service for atomic operation
    const transaction = await transactionService.borrowBook(
      bookId,
      userId,
      days
    );

    res.status(201).json({
      success: true,
      message: "Book borrowed successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Error borrowing book:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/transactions/return - Return a book
router.post("/return", async (req, res) => {
  try {
    const { transactionId } = req.body;

    console.log("Return request received:", { transactionId });

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: "Transaction ID is required",
      });
    }

    const updatedTransaction = await transactionService.returnBook(
      transactionId
    );

    res.json({
      success: true,
      message: "Book returned successfully",
      data: updatedTransaction,
      fine:
        updatedTransaction.fineAmount > 0
          ? `Overdue fine: ₹${updatedTransaction.fineAmount}`
          : null,
    });
  } catch (error) {
    console.error("Error returning book:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /api/transactions/renew - Renew a book
router.post("/renew", async (req, res) => {
  try {
    const { transactionId, additionalDays = 7 } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: "Transaction ID is required",
      });
    }

    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Transaction not found",
      });
    }

    if (transaction.status !== "borrowed") {
      return res.status(400).json({
        success: false,
        error: "Only borrowed books can be renewed",
      });
    }

    if (transaction.renewalCount >= 2) {
      return res.status(400).json({
        success: false,
        error: "Maximum renewal limit reached",
      });
    }

    // Extend due date
    transaction.dueDate = new Date(transaction.dueDate);
    transaction.dueDate.setDate(transaction.dueDate.getDate() + additionalDays);
    transaction.renewalCount += 1;

    await transaction.save();

    res.json({
      success: true,
      message: "Book renewed successfully",
      data: transaction,
      newDueDate: transaction.dueDate,
    });
  } catch (error) {
    console.error("Error renewing book:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/transactions - Get all transactions
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, status, userId, bookId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (bookId) query.bookId = bookId;

    const transactions = await Transaction.find(query)
      .populate("bookId", "title author bookId category")
      .populate("userId", "name email userType")
      .sort({ borrowDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTransactions: total,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch transactions",
    });
  }
});

// GET /api/transactions/overdue - Get overdue transactions
router.get("/overdue", async (req, res) => {
  try {
    const overdueTransactions = await Transaction.find({
      status: "overdue",
    })
      .populate("bookId", "title author")
      .populate("userId", "name email")
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: overdueTransactions,
      total: overdueTransactions.length,
    });
  } catch (error) {
    console.error("Error fetching overdue transactions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch overdue transactions",
    });
  }
});

// GET /api/transactions/user/:userId - Get user's transactions
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;

    const query = { userId };
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate("bookId", "title author category")
      .sort({ borrowDate: -1 });

    res.json({
      success: true,
      data: transactions,
      total: transactions.length,
    });
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user transactions",
    });
  }
});

// POST /api/transactions/update-overdue - Update overdue status
router.post("/update-overdue", async (req, res) => {
  try {
    const updatedCount = await Transaction.updateOverdueTransactions();
    res.json({
      success: true,
      message: `Updated ${updatedCount} transactions to overdue status`,
      updatedCount,
    });
  } catch (error) {
    console.error("Error updating overdue transactions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update overdue transactions",
    });
  }
});

export default router;
