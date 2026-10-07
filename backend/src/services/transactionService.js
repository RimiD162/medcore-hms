const prisma = require('../config/prisma');
const { roundMoney } = require('../utils/financeMoney');

class TransactionService {
  /**
   * Get unified derived financial transactions stream
   */
  async getTransactions(filters = {}, pagination = {}) {
    const page = Math.max(1, parseInt(pagination.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const type = filters.type || 'ALL'; // ALL, PAYMENT, REFUND, EXPENSE, CREDIT, DEBIT
    const search = filters.search ? filters.search.trim().toLowerCase() : '';

    const dateFilter = {};
    if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Build query promises based on type filter
    const fetchPayments = type === 'ALL' || type === 'PAYMENT' || type === 'CREDIT';
    const fetchRefunds = type === 'ALL' || type === 'REFUND' || type === 'DEBIT';
    const fetchExpenses = type === 'ALL' || type === 'EXPENSE' || type === 'DEBIT';

    const [payments, refunds, expenses] = await Promise.all([
      fetchPayments
        ? prisma.payment.findMany({
            where: {
              ...(Object.keys(dateFilter).length > 0 ? { paymentDate: dateFilter } : {}),
              ...(filters.paymentMethod && filters.paymentMethod !== 'ALL' ? { paymentMethod: filters.paymentMethod } : {}),
            },
            include: {
              invoice: {
                select: {
                  id: true,
                  invoiceNumber: true,
                  patient: {
                    select: {
                      id: true,
                      patientIdNumber: true,
                      fullName: true,
                      phone: true,
                      gender: true,
                      age: true,
                    },
                  },
                },
              },
              receivedBy: {
                select: { id: true, fullName: true, email: true, role: true },
              },
            },
          })
        : [],

      fetchRefunds
        ? prisma.refund.findMany({
            where: {
              ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
              ...(filters.paymentMethod && filters.paymentMethod !== 'ALL' ? { refundMethod: filters.paymentMethod } : {}),
            },
            include: {
              invoice: {
                select: {
                  id: true,
                  invoiceNumber: true,
                  patient: {
                    select: {
                      id: true,
                      patientIdNumber: true,
                      fullName: true,
                      phone: true,
                      gender: true,
                      age: true,
                    },
                  },
                },
              },
              requestedBy: {
                select: { id: true, fullName: true, email: true, role: true },
              },
              processedBy: {
                select: { id: true, fullName: true, email: true, role: true },
              },
            },
          })
        : [],

      fetchExpenses
        ? prisma.expense.findMany({
            where: {
              ...(Object.keys(dateFilter).length > 0 ? { expenseDate: dateFilter } : {}),
              ...(filters.category && filters.category !== 'ALL' ? { category: filters.category } : {}),
            },
            include: {
              createdBy: {
                select: { id: true, fullName: true, email: true, role: true },
              },
              cancelledBy: {
                select: { id: true, fullName: true, email: true, role: true },
              },
            },
          })
        : [],
    ]);

    // Map payments to unified transaction item
    const paymentItems = payments.map((p) => ({
      id: p.id,
      transactionNumber: p.paymentNumber,
      type: 'PAYMENT',
      category: 'Patient Payment',
      direction: 'CREDIT',
      amount: roundMoney(p.amount),
      status: p.status, // COMPLETED or VOIDED
      paymentMethod: p.paymentMethod,
      transactionDate: p.paymentDate || p.createdAt,
      reference: p.invoice?.invoiceNumber || 'N/A',
      invoiceId: p.invoiceId,
      patient: p.invoice?.patient
        ? {
            id: p.invoice.patient.id,
            patientId: p.invoice.patient.patientIdNumber,
            fullName: p.invoice.patient.fullName,
            phone: p.invoice.patient.phone,
            gender: p.invoice.patient.gender,
            age: p.invoice.patient.age,
          }
        : null,
      recordedBy: p.receivedBy,
      notes: p.notes,
      isVoided: p.status === 'VOIDED',
      voidReason: p.voidReason,
    }));

    // Map refunds to unified transaction item
    const refundItems = refunds.map((r) => ({
      id: r.id,
      transactionNumber: r.refundNumber,
      type: 'REFUND',
      category: 'Patient Refund',
      direction: 'DEBIT',
      amount: roundMoney(r.amount),
      status: r.status, // REQUESTED, APPROVED, PROCESSED, REJECTED
      paymentMethod: r.refundMethod,
      transactionDate: r.processedAt || r.createdAt,
      reference: r.invoice?.invoiceNumber || 'N/A',
      invoiceId: r.invoiceId,
      patient: r.invoice?.patient
        ? {
            id: r.invoice.patient.id,
            patientId: r.invoice.patient.patientIdNumber,
            fullName: r.invoice.patient.fullName,
            phone: r.invoice.patient.phone,
            gender: r.invoice.patient.gender,
            age: r.invoice.patient.age,
          }
        : null,
      recordedBy: r.processedBy || r.requestedBy,
      notes: r.reason,
      isProcessed: r.status === 'PROCESSED',
    }));

    // Map expenses to unified transaction item
    const expenseItems = expenses.map((e) => ({
      id: e.id,
      transactionNumber: e.expenseNumber,
      type: 'EXPENSE',
      category: e.category,
      direction: 'DEBIT',
      amount: roundMoney(e.amount),
      status: e.status, // RECORDED, CANCELLED
      paymentMethod: e.paymentMethod || 'BANK_TRANSFER',
      transactionDate: e.expenseDate,
      reference: e.vendor || e.referenceNumber || e.description,
      invoiceId: null,
      patient: null,
      recordedBy: e.createdBy,
      notes: e.description + (e.notes ? ` - ${e.notes}` : ''),
      isApproved: e.status === 'RECORDED',
    }));

    // Combine all
    let allTransactions = [...paymentItems, ...refundItems, ...expenseItems];

    // Search filter across text fields
    if (search) {
      allTransactions = allTransactions.filter((tx) => {
        const tn = (tx.transactionNumber || '').toLowerCase();
        const ref = (tx.reference || '').toLowerCase();
        const pat = (tx.patient?.fullName || '').toLowerCase();
        const patId = (tx.patient?.patientId || '').toLowerCase();
        const notes = (tx.notes || '').toLowerCase();
        const cat = (tx.category || '').toLowerCase();
        return (
          tn.includes(search) ||
          ref.includes(search) ||
          pat.includes(search) ||
          patId.includes(search) ||
          notes.includes(search) ||
          cat.includes(search)
        );
      });
    }

    // Sort by transactionDate descending
    allTransactions.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

    // Summary calculation (effective settled money only)
    let totalInflow = 0;
    let totalOutflow = 0;

    for (const tx of allTransactions) {
      if (tx.type === 'PAYMENT' && tx.status === 'COMPLETED') {
        totalInflow = roundMoney(totalInflow + tx.amount);
      } else if (tx.type === 'REFUND' && tx.status === 'PROCESSED') {
        totalOutflow = roundMoney(totalOutflow + tx.amount);
      } else if (tx.type === 'EXPENSE' && tx.status === 'RECORDED') {
        totalOutflow = roundMoney(totalOutflow + tx.amount);
      }
    }

    const netCashFlow = roundMoney(totalInflow - totalOutflow);

    // Apply pagination
    const total = allTransactions.length;
    const paginated = allTransactions.slice(skip, skip + limit);

    return {
      transactions: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        totalInflow,
        totalOutflow,
        netCashFlow,
        totalTransactions: total,
      },
    };
  }
}

module.exports = new TransactionService();
