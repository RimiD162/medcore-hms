const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class PharmacyNotificationService {
  /**
   * List notifications for pharmacist
   */
  async getNotifications(userId, query = {}) {
    const { isRead, limit = 50 } = query;

    const where = {
      userId,
      ...(isRead !== undefined && { isRead: isRead === 'true' }),
    };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit, 10),
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
    };
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

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Mark all notifications as read for pharmacist
   */
  async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true, message: 'All notifications marked as read' };
  }
}

module.exports = new PharmacyNotificationService();
