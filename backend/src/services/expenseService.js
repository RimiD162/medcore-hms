const prisma = require('../config/prisma');
const { generateExpenseNumber } = require('../utils/patientIdGenerator');
const { roundMoney } = require('../utils/financeMoney');

class ExpenseService {
  /**
   * List expenses with multi-criteria filtering and pagination
   */
  async listExpenses(filters = {}, pagination = {}) {
    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const sortBy = pagination.sortBy || 'expenseDate';
    const sortOrder = pagination.sortOrder === 'asc' ? 'asc' : 'desc';

    const where = {};

    if (filters.category && filters.category !== 'ALL') {
      where.category = filters.category;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { expenseNumber: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { vendor: { contains: q, mode: 'insensitive' } },
        { referenceNumber: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.expenseDate = {};
      if (filters.startDate) {
        where.expenseDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    if (filters.minAmount !== undefined && filters.minAmount !== '') {
      where.amount = { ...(where.amount || {}), gte: parseFloat(filters.minAmount) };
    }
    if (filters.maxAmount !== undefined && filters.maxAmount !== '') {
      where.amount = { ...(where.amount || {}), lte: parseFloat(filters.maxAmount) };
    }

    const [total, expenses, aggregateSummary] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: {
            select: { id: true, fullName: true, email: true, role: true },
          },
          cancelledBy: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      }),
      prisma.expense.aggregate({
        where: {
          ...where,
          status: 'RECORDED',
        },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const formattedExpenses = expenses.map((exp) => ({
      id: exp.id,
      expenseNumber: exp.expenseNumber,
      title: exp.description,
      description: exp.description,
      category: exp.category,
      amount: roundMoney(exp.amount),
      expenseDate: exp.expenseDate,
      vendor: exp.vendor,
      vendorName: exp.vendor,
      referenceNumber: exp.referenceNumber,
      paymentMethod: exp.paymentMethod,
      status: exp.status,
      notes: exp.notes,
      createdBy: exp.createdBy,
      recordedBy: exp.createdBy,
      cancelledBy: exp.cancelledBy,
      cancelledAt: exp.cancelledAt,
      cancelReason: exp.cancelReason,
      createdAt: exp.createdAt,
      updatedAt: exp.updatedAt,
    }));

    return {
      expenses: formattedExpenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        totalAmount: roundMoney(aggregateSummary._sum.amount || 0),
        activeCount: aggregateSummary._count.id || 0,
      },
    };
  }

  /**
   * Get single expense by ID
   */
  async getExpenseById(id) {
    const exp = await prisma.expense.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        cancelledBy: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
    });

    if (!exp) {
      const err = new Error('Expense record not found');
      err.statusCode = 404;
      throw err;
    }

    return {
      id: exp.id,
      expenseNumber: exp.expenseNumber,
      title: exp.description,
      description: exp.description,
      category: exp.category,
      amount: roundMoney(exp.amount),
      expenseDate: exp.expenseDate,
      vendor: exp.vendor,
      vendorName: exp.vendor,
      referenceNumber: exp.referenceNumber,
      paymentMethod: exp.paymentMethod,
      status: exp.status,
      notes: exp.notes,
      createdBy: exp.createdBy,
      recordedBy: exp.createdBy,
      cancelledBy: exp.cancelledBy,
      cancelledAt: exp.cancelledAt,
      cancelReason: exp.cancelReason,
      createdAt: exp.createdAt,
      updatedAt: exp.updatedAt,
    };
  }

  /**
   * Check for potential duplicate expense
   */
  async checkDuplicateExpense({ vendorName, vendor, referenceNumber, amount, ignoreId = null }) {
    const targetVendor = vendorName || vendor;
    if (!targetVendor || !amount) return null;

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const where = {
      vendor: { equals: targetVendor.trim(), mode: 'insensitive' },
      amount: roundMoney(amount),
      status: 'RECORDED',
      createdAt: { gte: sixtyDaysAgo },
    };

    if (referenceNumber && referenceNumber.trim()) {
      where.referenceNumber = { equals: referenceNumber.trim(), mode: 'insensitive' };
    }
    if (ignoreId) {
      where.id = { not: ignoreId };
    }

    const duplicate = await prisma.expense.findFirst({
      where,
      select: {
        id: true,
        expenseNumber: true,
        description: true,
        vendor: true,
        amount: true,
        expenseDate: true,
        referenceNumber: true,
      },
    });

    return duplicate;
  }

  /**
   * Record new expense
   */
  async createExpense(data, user) {
    const amount = roundMoney(data.amount);
    if (amount <= 0) {
      const err = new Error('Expense amount must be greater than zero');
      err.statusCode = 400;
      throw err;
    }

    const vendor = data.vendorName || data.vendor || null;

    // Check duplicate warning
    const potentialDuplicate = await this.checkDuplicateExpense({
      vendor,
      referenceNumber: data.referenceNumber,
      amount: data.amount,
    });

    if (potentialDuplicate && !data.confirmDuplicate) {
      const err = new Error(
        `Potential duplicate expense detected: Similar expense #${potentialDuplicate.expenseNumber} (${potentialDuplicate.vendor}, ₹${potentialDuplicate.amount}) recorded on ${new Date(potentialDuplicate.expenseDate).toLocaleDateString()}. Set confirmDuplicate: true to proceed.`
      );
      err.statusCode = 409;
      err.duplicateDetails = potentialDuplicate;
      throw err;
    }

    const expenseDate = data.expenseDate ? new Date(data.expenseDate) : new Date();
    const title = (data.title || data.description || 'General Expense').trim();
    const notes = data.notes || (data.description !== data.title ? data.description : null) || null;

    const result = await prisma.$transaction(async (tx) => {
      const expenseNumber = await generateExpenseNumber(tx);

      const expense = await tx.expense.create({
        data: {
          expenseNumber,
          description: title,
          category: data.category,
          amount,
          expenseDate,
          vendor: vendor ? vendor.trim() : null,
          referenceNumber: data.referenceNumber ? data.referenceNumber.trim() : null,
          paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
          status: 'RECORDED',
          notes: notes ? notes.trim() : null,
          createdById: user.id,
        },
        include: {
          createdBy: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: 'CREATE_EXPENSE',
          entity: 'Expense',
          entityId: expense.id,
          userName: user?.fullName || null,
          role: user?.role || null,
          description: `Created expense #${expense.expenseNumber} for ${expense.vendor || 'N/A'}: ${expense.description} totaling ₹${expense.amount}.`,
        },
      });

      return expense;
    }, { maxWait: 15000, timeout: 60000 });

    return {
      ...result,
      title: result.description,
      vendorName: result.vendor,
      recordedBy: result.createdBy,
      amount: roundMoney(result.amount),
    };
  }

  /**
   * Cancel an expense
   */
  async cancelExpense(id, user, reason) {
    if (!reason || !reason.trim()) {
      const err = new Error('A valid reason is required to cancel an expense');
      err.statusCode = 400;
      throw err;
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      const err = new Error('Expense record not found');
      err.statusCode = 404;
      throw err;
    }

    if (expense.status === 'CANCELLED') {
      const err = new Error('Expense is already cancelled');
      err.statusCode = 400;
      throw err;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const exp = await tx.expense.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledById: user.id,
          cancelledAt: new Date(),
          cancelReason: reason.trim(),
        },
        include: {
          createdBy: {
            select: { id: true, fullName: true, email: true, role: true },
          },
          cancelledBy: {
            select: { id: true, fullName: true, email: true, role: true },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'CANCEL_EXPENSE',
          entity: 'Expense',
          entityId: exp.id,
          userName: user?.fullName || null,
          role: user?.role || null,
          description: `Cancelled expense #${exp.expenseNumber}. Reason: ${reason.trim()}`,
        },
      });

      return exp;
    }, { maxWait: 15000, timeout: 60000 });

    return {
      ...updated,
      title: updated.description,
      vendorName: updated.vendor,
      recordedBy: updated.createdBy,
      amount: roundMoney(updated.amount),
    };
  }

  /**
   * Get category summary breakdown for expenses
   */
  async getExpenseCategoriesSummary(startDate, endDate) {
    const where = {
      status: 'RECORDED',
    };

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    const groupResult = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    const totalExpense = groupResult.reduce((sum, g) => sum + (g._sum.amount || 0), 0);

    const categories = groupResult.map((g) => {
      const amount = roundMoney(g._sum.amount || 0);
      const percentage = totalExpense > 0 ? roundMoney((amount / totalExpense) * 100) : 0;
      return {
        category: g.category,
        count: g._count.id,
        amount,
        percentage,
      };
    });

    categories.sort((a, b) => b.amount - a.amount);

    return {
      totalAmount: roundMoney(totalExpense),
      categories,
    };
  }
}

module.exports = new ExpenseService();
