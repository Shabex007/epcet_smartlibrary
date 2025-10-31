import mongoose from "mongoose";
import Book from "../models/Book.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import dotenv from "dotenv";

dotenv.config();

// Helper function to generate book IDs
function generateBookId() {
  return `B${Date.now()}${Math.random()
    .toString(36)
    .substr(2, 5)}`.toUpperCase();
}

// Helper function to generate user IDs
function generateUserId() {
  return `U${Date.now()}${Math.random()
    .toString(36)
    .substr(2, 5)}`.toUpperCase();
}

const sampleBooks = [
  {
    bookId: generateBookId(),
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    category: "Fiction",
    isbn: "9780743273565",
    totalCopies: 5,
    availableCopies: 3,
    publishedYear: 1925,
    description: "A classic novel of the Jazz Age",
  },
  {
    bookId: generateBookId(),
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    category: "Fiction",
    isbn: "9780061120084",
    totalCopies: 4,
    availableCopies: 2,
    publishedYear: 1960,
    description: "A novel about racial inequality and moral growth",
  },
  {
    bookId: generateBookId(),
    title: "1984",
    author: "George Orwell",
    category: "Science Fiction",
    isbn: "9780451524935",
    totalCopies: 6,
    availableCopies: 4,
    publishedYear: 1949,
    description: "Dystopian social science fiction novel",
  },
  {
    bookId: generateBookId(),
    title: "Pride and Prejudice",
    author: "Jane Austen",
    category: "Romance",
    isbn: "9780141439518",
    totalCopies: 3,
    availableCopies: 1,
    publishedYear: 1813,
    description: "Romantic novel of manners",
  },
  {
    bookId: generateBookId(),
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    category: "Fantasy",
    isbn: "9780547928227",
    totalCopies: 5,
    availableCopies: 3,
    publishedYear: 1937,
    description: "Fantasy novel and children's book",
  },
  {
    bookId: generateBookId(),
    title: "Harry Potter and the Philosopher's Stone",
    author: "J.K. Rowling",
    category: "Fantasy",
    isbn: "9780747532743",
    totalCopies: 7,
    availableCopies: 5,
    publishedYear: 1997,
    description: "First book in the Harry Potter series",
  },
  {
    bookId: generateBookId(),
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    category: "Fiction",
    isbn: "9780316769174",
    totalCopies: 3,
    availableCopies: 2,
    publishedYear: 1951,
    description: "A novel about teenage rebellion",
  },
  {
    bookId: generateBookId(),
    title: "Lord of the Flies",
    author: "William Golding",
    category: "Fiction",
    isbn: "9780571056866",
    totalCopies: 4,
    availableCopies: 3,
    publishedYear: 1954,
    description:
      "A novel about a group of British boys stranded on an uninhabited island",
  },
];

const sampleUsers = [
  {
    userId: generateUserId(),
    name: "John Doe",
    email: "john.doe@university.edu",
    userType: "student",
    department: "Computer Science",
  },
  {
    userId: generateUserId(),
    name: "Jane Smith",
    email: "jane.smith@university.edu",
    userType: "student",
    department: "Mathematics",
  },
  {
    userId: generateUserId(),
    name: "Dr. Robert Johnson",
    email: "robert.johnson@university.edu",
    userType: "faculty",
    department: "Physics",
  },
  {
    userId: generateUserId(),
    name: "Sarah Wilson",
    email: "sarah.wilson@university.edu",
    userType: "staff",
    department: "Library",
  },
  {
    userId: generateUserId(),
    name: "Mike Brown",
    email: "mike.brown@gmail.com",
    userType: "public",
  },
  {
    userId: generateUserId(),
    name: "Emily Davis",
    email: "emily.davis@university.edu",
    userType: "student",
    department: "English Literature",
  },
  {
    userId: generateUserId(),
    name: "Prof. David Miller",
    email: "david.miller@university.edu",
    userType: "faculty",
    department: "History",
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB with longer timeout
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🗑️ Clearing existing data...");
    await Book.deleteMany({});
    await User.deleteMany({});
    await Transaction.deleteMany({});
    console.log("✅ Cleared existing data");

    // Insert sample data with validation
    console.log("📥 Inserting sample data...");
    const insertedBooks = await Book.insertMany(sampleBooks, {
      validateBeforeSave: true,
    });
    const insertedUsers = await User.insertMany(sampleUsers, {
      validateBeforeSave: true,
    });

    console.log("✅ Sample data inserted successfully!");
    console.log(`📚 Added ${insertedBooks.length} books`);
    console.log(`👥 Added ${insertedUsers.length} users`);

    // Verify data was actually saved
    console.log("🔍 Verifying data...");
    const bookCount = await Book.countDocuments();
    const userCount = await User.countDocuments();

    console.log(
      `📊 Verification: ${bookCount} books, ${userCount} users in database`
    );

    if (bookCount === 0 || userCount === 0) {
      throw new Error("Data verification failed - no documents found");
    }

    // Display inserted data
    const books = await Book.find().limit(5);
    const users = await User.find().limit(5);

    console.log("\n📖 Sample Books (first 5):");
    books.forEach((book) => {
      console.log(
        `   - ${book.title} by ${book.author} (${book.availableCopies}/${book.totalCopies} available)`
      );
    });

    console.log("\n👤 Sample Users (first 5):");
    users.forEach((user) => {
      console.log(`   - ${user.name} (${user.userType}) - ${user.email}`);
    });

    console.log("\n🎯 Sample Data Ready for Testing!");
    console.log("   You can now:");
    console.log("   1. Start the server: npm start");
    console.log("   2. Test API endpoints");
    console.log("   3. Check analytics at /api/analytics");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  } finally {
    // Don't close connection immediately, wait a bit
    setTimeout(async () => {
      await mongoose.connection.close();
      console.log("\nDatabase connection closed");
      process.exit(0);
    }, 2000);
  }
}

// Run the seed function
seedDatabase();

export { sampleBooks, sampleUsers, seedDatabase };
