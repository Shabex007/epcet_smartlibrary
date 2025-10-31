import Book from "../models/Book.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";

class TransactionService {
  async borrowBook(bookId, userId, days = 14) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Validate ObjectId format
      if (
        !mongoose.Types.ObjectId.isValid(bookId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        throw new Error("Invalid Book ID or User ID format");
      }

      // Check book availability
      const book = await Book.findById(bookId).session(session);
      if (!book) {
        throw new Error("Book not found");
      }
      if (book.availableCopies < 1) {
        throw new Error("Book not available - no copies left");
      }

      // Check if user exists and is active
      const user = await User.findOne({ _id: userId, isActive: true }).session(
        session
      );
      if (!user) {
        throw new Error("User not found or inactive");
      }

      // Check if user already has this book borrowed
      const existingBorrow = await Transaction.findOne({
        userId,
        bookId,
        status: { $in: ["borrowed", "overdue"] },
      }).session(session);

      if (existingBorrow) {
        throw new Error("User already has this book borrowed");
      }

      // Calculate due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + parseInt(days));

      // Create transaction - let the pre-save middleware generate transactionId
      const transaction = new Transaction({
        bookId,
        userId,
        dueDate,
      });

      // Update book copies
      book.availableCopies -= 1;

      await Promise.all([
        transaction.save({ session }),
        book.save({ session }),
      ]);

      await session.commitTransaction();

      // Populate before returning
      const populatedTransaction = await Transaction.findById(transaction._id)
        .populate("bookId", "title author bookId category")
        .populate("userId", "name email userType");

      return populatedTransaction;
    } catch (error) {
      await session.abortTransaction();
      console.error("Transaction service error:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async returnBook(transactionId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (!transactionId) {
        throw new Error("Transaction ID is required");
      }

      const transaction = await Transaction.findOne({ transactionId }).session(
        session
      );
      if (!transaction) {
        throw new Error(`Transaction not found with ID: ${transactionId}`);
      }

      if (transaction.status === "returned") {
        throw new Error("Book already returned");
      }

      // Update transaction
      transaction.returnDate = new Date();
      transaction.status = "returned";

      // Calculate fine if overdue (₹5 per day)
      if (transaction.returnDate > transaction.dueDate) {
        const overdueDays = Math.ceil(
          (transaction.returnDate - transaction.dueDate) / (1000 * 60 * 60 * 24)
        );
        transaction.fineAmount = overdueDays * 5;
      }

      // Update book availability
      const book = await Book.findById(transaction.bookId).session(session);
      if (book) {
        book.availableCopies += 1;
        await book.save({ session });
      }

      await transaction.save({ session });

      await session.commitTransaction();

      // Populate before returning
      const populatedTransaction = await Transaction.findById(transaction._id)
        .populate("bookId", "title author bookId category")
        .populate("userId", "name email userType");

      return populatedTransaction;
    } catch (error) {
      await session.abortTransaction();
      console.error("Return service error:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getBorrowingHistory(userId) {
    try {
      const transactions = await Transaction.find({ userId })
        .populate("bookId", "title author category")
        .sort({ borrowDate: -1 });

      return transactions;
    } catch (error) {
      throw error;
    }
  }

  async getBookBorrowingHistory(bookId) {
    try {
      const transactions = await Transaction.find({ bookId })
        .populate("userId", "name email userType")
        .sort({ borrowDate: -1 });

      return transactions;
    } catch (error) {
      throw error;
    }
  }
}

export default new TransactionService();
