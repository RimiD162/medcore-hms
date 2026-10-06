const prisma = require('../config/prisma');

class PharmacyBillingService {
  /**
   * List billed pharmacy charges with billing/invoice and payment status (Read-only for pharmacist)
   */
  async getSales(query = {}) {
    const { search, invoiceStatus, startDate, endDate, page = 1, limit = 20 } = query;

    const where = {
      source: 'PHARMACY',
    };

    if (invoiceStatus && invoiceStatus !== 'ALL') {
      where.invoice = { status: invoiceStatus };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    if (search) {
      where.OR = [
        { serviceName: { contains: search, mode: 'insensitive' } },
        { invoice: { invoiceNumber: { contains: search, mode: 'insensitive' } } },
        { invoice: { patient: { fullName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, items] = await Promise.all([
      prisma.invoiceItem.count({ where }),
      prisma.invoiceItem.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              status: true,
              issueDate: true,
              totalAmount: true,
              paidAmount: true,
              outstandingAmount: true,
              patient: {
                select: {
                  id: true,
                  patientIdNumber: true,
                  fullName: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    // Calculate aggregate totals
    const totalBilledSales = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);

    return {
      sales: items,
      summary: {
        totalItemsCount: total,
        totalBilledValue: totalBilledSales,
      },
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }
}

module.exports = new PharmacyBillingService();
