/**
 * Receptionist Billing Service Adapter
 * Thin delegation wrapper over shared InvoiceService and PaymentService.
 * Preserves 100% backward compatibility with Receptionist endpoints, controllers, and tests.
 */

const invoiceService = require('./invoiceService');
const paymentService = require('./paymentService');

class ReceptionistBillingService {
  /**
   * List active service catalog items
   */
  async getServiceCatalog(category = null) {
    return invoiceService.getServiceCatalog(category);
  }

  /**
   * Create an invoice for a patient from configured service catalog items
   */
  async createInvoice(data, createdById) {
    return invoiceService.createInvoice(data, createdById);
  }

  /**
   * Search, filter, and list invoices
   */
  async getInvoices(query = {}) {
    return invoiceService.getInvoices(query);
  }

  /**
   * Get single invoice details by ID
   */
  async getInvoiceById(invoiceId) {
    return invoiceService.getInvoiceById(invoiceId);
  }

  /**
   * Record a payment against an existing invoice
   */
  async recordPayment(data, receivedById) {
    return paymentService.recordPayment(data, receivedById);
  }

  /**
   * List payment receipts and transaction history
   */
  async getPayments(query = {}) {
    return paymentService.getPayments(query);
  }
}

module.exports = new ReceptionistBillingService();
