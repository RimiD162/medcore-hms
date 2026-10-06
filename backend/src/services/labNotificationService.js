const prisma = require('../config/prisma');
const ApiError = require('../utils/ApiError');

class LabNotificationService {
  /**
   * List notifications relevant to laboratory staff
   */
  async listNotifications(userId, query = {}) {
    const { isRead, limit = 50 } = query;

    const where = {
      OR: [
        { userId },
        { title: { contains: 'Lab', mode: 'insensitive' } },
        { title: { contains: 'Specimen', mode: 'insensitive' } },
        { title: { contains: 'CRITICAL', mode: 'insensitive' } },
      ],
    };

    if (isRead !== undefined) {
      where.isRead = isRead === 'true' || isRead === true;
    }

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    return prisma.notification.updateMany({
      where: {
        OR: [
          { userId },
          { title: { contains: 'Lab', mode: 'insensitive' } },
          { title: { contains: 'CRITICAL', mode: 'insensitive' } },
        ],
        isRead: false,
      },
      data: { isRead: true },
    });
  }
}

module.exports = new LabNotificationService();
