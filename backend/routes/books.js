import express from "express";
import Book from "../models/Book.js";

const router = express.Router();

// GET /api/books - Get all books with pagination and search
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      category = "",
      available,
    } = req.query;

    // Build search query
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (category) {
      query.category = { $regex: category, $options: "i" };
    }
    if (available === "true") {
      query.availableCopies = { $gt: 0 };
    }

    const books = await Book.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ title: 1 });

    const total = await Book.countDocuments(query);

    res.json({
      success: true,
      data: books,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBooks: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch books",
    });
  }
});

// GET /api/books/categories - Get all book categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Book.distinct("category");
    res.json({
      success: true,
      data: categories.sort(),
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch categories",
    });
  }
});

// GET /api/books/:id - Get single book
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }
    res.json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch book",
    });
  }
});

// POST /api/books - Add new book
router.post("/", async (req, res) => {
  try {
    const bookData = req.body;

    // Set available copies if not provided
    if (!bookData.availableCopies && bookData.totalCopies) {
      bookData.availableCopies = bookData.totalCopies;
    }

    const book = new Book(bookData);
    await book.save();

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: book,
    });
  } catch (error) {
    console.error("Error adding book:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Book ID or ISBN already exists",
      });
    }
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// PUT /api/books/:id - Update book
router.put("/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }

    res.json({
      success: true,
      message: "Book updated successfully",
      data: book,
    });
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// DELETE /api/books/:id - Delete book
router.delete("/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        error: "Book not found",
      });
    }

    res.json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete book",
    });
  }
});

export default router;
