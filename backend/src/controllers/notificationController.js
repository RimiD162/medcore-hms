const notificationService = require('../services/notificationService');
const ApiResponse = require('../utils/ApiResponse');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const data = await notificationService.getNotifications(req.user.id, req.query);
      return ApiResponse.success(res, data, 'Notifications retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const data = await notificationService.getUnreadCount(req.user.id);
      return ApiResponse.success(res, data, 'Unread notification count retrieved');
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const updated = await notificationService.markAsRead(req.user.id, req.params.id);
      return ApiResponse.success(res, updated, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      return ApiResponse.success(res, result, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
