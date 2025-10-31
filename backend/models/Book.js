import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    bookId: {
      type: String,
      required: [true, "Book ID is required"],
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    totalCopies: {
      type: Number,
      default: 1,
      min: [0, "Total copies cannot be negative"],
    },
    availableCopies: {
      type: Number,
      default: 1,
      min: [0, "Available copies cannot be negative"],
    },
    publishedYear: {
      type: Number,
      min: [1000, "Published year seems invalid"],
      max: [new Date().getFullYear(), "Published year cannot be in future"],
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to ensure availableCopies doesn't exceed totalCopies
bookSchema.pre("save", function (next) {
  if (this.availableCopies > this.totalCopies) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

// Auto-generate bookId if not provided
bookSchema.pre("save", function (next) {
  if (!this.bookId) {
    this.bookId = `B${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 5)}`.toUpperCase();
  }
  next();
});

// Index for better search performance
bookSchema.index({ title: "text", author: "text", category: "text" });
bookSchema.index({ category: 1 });
bookSchema.index({ availableCopies: 1 });

// Virtual for checking availability
bookSchema.virtual("isAvailable").get(function () {
  return this.availableCopies > 0;
});

export default mongoose.model("Book", bookSchema);
