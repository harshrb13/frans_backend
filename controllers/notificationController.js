const Notification = require("../models/notificationModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const User = require("../models/userModel");
const sendPushNotifications = require("../utils/sendPushNotification");

exports.getMyNotifications = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const resPerPage = 15; // How many notifications to fetch per page
  const page = Number(req.query.page) || 1;
  const skip = resPerPage * (page - 1);

  // 1. Find paginated notifications for the user, newest first
  const notifications = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(resPerPage);

  // 2. Get the total count for pagination
  const totalCount = await Notification.countDocuments({ user: userId });

  res.status(200).json({
    success: true,
    totalCount: totalCount,
    count: notifications.length,
    resPerPage,
    data: notifications,
  });
});

exports.getUnreadStatus = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  const unreadNotification = await Notification.findOne({
    user: userId,
    isRead: false,
  }).select("_id");

  res.status(200).json({
    success: true,
    hasUnread: !!unreadNotification,
  });
});

exports.markAsRead = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const notificationId = req.params.id;

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    return next(new ErrorHandler("Notification not found.", 404));
  }

  if (notification.user.toString() !== userId) {
    return next(
      new ErrorHandler("Not authorized to perform this action.", 403)
    );
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    data: notification,
  });
});

exports.markAllAsRead = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true } }
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read.",
  });
});

exports.sendNotificationToUser = catchAsyncErrors(async (req, res, next) => {
  const { userId, message, link } = req.body;
  const title = "New Notification"; // Or from req.body
  const {io} = res.locals;

  if (!userId || !message || !link) {
    return next(
      new ErrorHandler("User ID, message, and link are all required.", 400)
    );
  }

  // 1. Check if the user exists
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler(`User not found with id: ${userId}`, 404));
  }

  // 2. Create the notification in the database
  const notification = await Notification.create({
    user: userId,
    message,
    link,
  });

 //push-notification
  if (user.pushToken) {
    await sendPushNotifications([user.pushToken], title, message, {
      link,
    });
  }

  //socket.io
  io.to(userId.toString()).emit("new_notification");

  res.status(201).json({
    success: true,
    data: notification,
    message: "Notification sent successfully.",
  });
});

exports.sendNotificationToAll = catchAsyncErrors(async (req, res, next) => {
  const { message, link } = req.body;
  const title = "New Update";
  const { io } = res.locals;

  if (!message || !link) {
    return next(new ErrorHandler("Message and link are required.", 400));
  }

  const usersWithTokens = await User.find({
    pushToken: { $exists: true, $ne: null },
  }).select("_id pushToken");

  if (usersWithTokens.length === 0) {
    return next(new ErrorHandler("No users with push tokens found.", 404));
  }

  // 2. Create the notification documents for every user
  const notifications = usersWithTokens.map((user) => ({
    user: user._id,
    message,
    link,
  }));

  // 3. Insert all notifications into the database in one efficient operation
  await Notification.insertMany(notifications);

  // 5. Send the broadcast push notification
  await sendPushNotifications(allPushTokens, title, message, { link });

  // (We will add Socket.io logic here later)
  io.emit("new_notification"); 

  res.status(200).json({
    success: true,
    message: `Notification sent to ${users.length} users.`,
  });
});
