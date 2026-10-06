const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class ReceptionistNotificationService {
  /**
   * List notifications for logged-in receptionist user
   */
  async getNotifications(userId, query = {}) {
    const { isRead, limit = 50 } = query;

    const where = {
      userId,
      ...(isRead !== undefined && { isRead: isRead === 'true' }),
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return {
      notifications,
      unreadCount,
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { unreadCount };
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(userId, notificationId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw ApiError.notFound('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { message: 'All notifications marked as read' };
  }
}

module.exports = new ReceptionistNotificationService();
