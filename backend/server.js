import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

// Import routes
import booksRouter from "./routes/books.js";
import usersRouter from "./routes/users.js";
import transactionsRouter from "./routes/transactions.js";
import analyticsRouter from "./routes/analytics.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/books", booksRouter);
app.use("/api/users", usersRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/analytics", analyticsRouter);

// Health check
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMessages = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };

  res.json({
    status: "OK",
    message: "Library API is running",
    timestamp: new Date().toISOString(),
    database: {
      status: statusMessages[dbStatus],
      connected: dbStatus === 1,
      name: mongoose.connection.name,
      host: mongoose.connection.host,
    },
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Library Management System API",
    database: "MongoDB Atlas (Cloud)",
    endpoints: {
      books: "/api/books",
      users: "/api/users",
      transactions: "/api/transactions",
      analytics: "/api/analytics",
      health: "/api/health",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("🚨 Error:", err.stack);
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Enhanced Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);

    // Log connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.log("💡 Troubleshooting tips:");
    console.log("   1. Check your MongoDB Atlas connection string");
    console.log("   2. Verify your IP is whitelisted in Atlas");
    console.log("   3. Check your database user credentials");
    console.log("   4. Ensure your cluster is running");
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    console.log("🔗 Connecting to MongoDB Atlas...");
    await connectDB();

    app.listen(PORT, () => {
      console.log(`\n🎉 Server is running!`);
      console.log(`📍 Local: http://localhost:${PORT}`);
      console.log(`🔍 Health: http://localhost:${PORT}/api/health`);
      console.log(`📚 API Base: http://localhost:${PORT}/api`);
      console.log(`💾 Database: MongoDB Atlas (Cloud)`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed.");
  process.exit(0);
});

startServer();
