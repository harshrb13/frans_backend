const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    /**
     * The user this notification is for.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Index for fast lookups by user
    },
    /**
     * The simple text message to display.
     * @example "Your review for 'Classic Linen Kurta' was approved."
     */
    message: {
      type: String,
      required: [true, "A notification message is required."],
      trim: true,
    },
    /**
     * The frontend route to navigate to on press.
     * @example "/product/60d...a4"
     * @example "/tryon-history"
     */
    link: {
      type: String,
      required: [true, "A notification link/route is required."],
    },
    /**
     * Has the user seen this notification?
     */
    isRead: {
      type: Boolean,
      default: false,
      index: true, // Index for fast lookups of unread notifications
    },
  },
  {
    timestamps: true, // Adds 'createdAt'
  }
);

module.exports = mongoose.model("Notification", notificationSchema);