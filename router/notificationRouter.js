const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  getUnreadStatus,
  markAsRead,
  markAllAsRead,
  sendNotificationToUser,
  sendNotificationToAll,
} = require("../controllers/notificationController"); 

const { isAuthenticatedUser, isAuthorizedRole } = require("../middlewares/auth"); 


router.use(isAuthenticatedUser);
router.route("/notifications").get(getMyNotifications);
router.route("/notifications/status").get(getUnreadStatus);
router.route("/notifications/read-all").put(markAllAsRead);
router.route("/notifications/:id/read").put(markAsRead);

router
  .route("/admin/notifications/send")
  .post(isAuthenticatedUser, isAuthorizedRole("admin"), sendNotificationToUser);

router
  .route("/admin/notifications/send-all")
  .post(isAuthenticatedUser, isAuthorizedRole("admin"), sendNotificationToAll);

module.exports = router;
