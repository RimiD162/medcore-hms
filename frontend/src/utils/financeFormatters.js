/**
 * MedCore Finance Formatting Utilities
 * Standardized money formatting, date parsing, status badges & arithmetic for the finance workspace.
 */

/**
 * Formats a number/string into standard Indian Rupee currency string
 * e.g., 150000 -> ₹1,50,000.00
 */
export function formatCurrency(amount, currency = 'INR') {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0.00';
  }

  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Format with en-IN locale
  const formatted = absNum.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

/**
 * Compact currency for charts and summary counters (e.g. ₹1.5L, ₹25.4K)
 */
export function formatCompactCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0';
  }

  const num = Math.abs(Number(amount));
  const sign = Number(amount) < 0 ? '-' : '';

  if (num >= 10000000) {
    return `${sign}₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `${sign}₹${(num / 100000).toFixed(2)} L`;
  }
  if (num >= 1000) {
    return `${sign}₹${(num / 1000).toFixed(1)} K`;
  }

  return `${sign}₹${num.toFixed(2)}`;
}

/**
 * Standard date formatter
 */
export function formatDate(dateVal, includeTime = false) {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '—';

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return d.toLocaleDateString('en-US', options);
}

/**
 * Relative time helper (e.g., '2 hours ago', '3 days ago')
 */
export function formatTimeAgo(dateVal) {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  const now = new Date();
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) return formatDate(dateVal);
  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHour > 0) return `${diffHour}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'Just now';
}

/**
 * Maps invoice, payment, refund, and expense statuses to UI badge colors
 */
export function getStatusBadgeVariant(status) {
  switch (status?.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
    case 'PROCESSED':
    case 'APPROVED':
    case 'ACTIVE':
      return 'teal';

    case 'PARTIALLY_PAID':
    case 'PENDING':
    case 'REQUESTED':
    case 'UNDER_REVIEW':
      return 'amber';

    case 'OVERDUE':
    case 'REJECTED':
    case 'FAILED':
    case 'VOIDED':
    case 'CANCELLED':
      return 'danger';

    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return 'purple';

    default:
      return 'neutral';
  }
}

/**
 * Symmetric Half-Up Rounding preview calculation for UI item builders
 */
export function roundMoney(val) {
  const num = Number(val) || 0;
  const sign = num < 0 ? -1 : 1;
  return sign * Math.round(Math.abs(num) * 100 + Number.EPSILON * 100) / 100;
}
