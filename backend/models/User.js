import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    userType: {
      type: String,
      enum: {
        values: ["student", "faculty", "staff", "public"],
        message: "User type must be student, faculty, staff, or public",
      },
      required: true,
    },
    department: {
      type: String,
      trim: true,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate userId if not provided
userSchema.pre("save", function (next) {
  if (!this.userId) {
    this.userId = `U${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 5)}`.toUpperCase();
  }
  next();
});

// Index for better query performance
userSchema.index({ userType: 1 });
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });

export default mongoose.model("User", userSchema);
