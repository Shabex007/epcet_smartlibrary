import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: [true, "Transaction ID is required"],
      unique: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Book ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    borrowDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    returnDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: {
        values: ["borrowed", "returned", "overdue"],
        message: "Status must be borrowed, returned, or overdue",
      },
      default: "borrowed",
    },
    renewalCount: {
      type: Number,
      default: 0,
      min: [0, "Renewal count cannot be negative"],
    },
    fineAmount: {
      type: Number,
      default: 0,
      min: [0, "Fine amount cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
transactionSchema.index({ bookId: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ borrowDate: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ dueDate: 1 });
transactionSchema.index({ transactionId: 1 });

// Auto-generate transactionId - FIXED VERSION
transactionSchema.pre("save", function (next) {
  if (this.isNew && !this.transactionId) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    this.transactionId = `TXN${timestamp}${random}`.toUpperCase();
  }
  next();
});

// Virtual for calculating if transaction is overdue
transactionSchema.virtual("isOverdue").get(function () {
  return this.status === "borrowed" && new Date() > this.dueDate;
});

// Virtual for borrow duration in days
transactionSchema.virtual("borrowDuration").get(function () {
  if (!this.returnDate) return null;
  return Math.ceil((this.returnDate - this.borrowDate) / (1000 * 60 * 60 * 24));
});

// Method to calculate overdue days
transactionSchema.methods.calculateOverdueDays = function () {
  if (this.status !== "borrowed") return 0;
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Static method to update overdue transactions
transactionSchema.statics.updateOverdueTransactions = async function () {
  const overdueTransactions = await this.find({
    status: "borrowed",
    dueDate: { $lt: new Date() },
  });

  for (const transaction of overdueTransactions) {
    transaction.status = "overdue";
    await transaction.save();
  }

  return overdueTransactions.length;
};

export default mongoose.model("Transaction", transactionSchema);
