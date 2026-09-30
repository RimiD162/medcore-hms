import React from 'react';

/**
 * DataTable — reusable paginated table with loading skeleton and empty state
 * @param {Array}    columns    - [{ key, label, render? }]
 * @param {Array}    data       - array of row objects
 * @param {boolean}  loading
 * @param {string}   emptyMessage
 * @param {object}   pagination - { page, limit, total, onPageChange }
 * @param {function} onRowClick
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found.',
  pagination,
  onRowClick,
}) {
  const skeletonRows = Array.from({ length: pagination?.limit || 8 });

  if (loading) {
    return (
      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="ui-th">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {skeletonRows.map((_, i) => (
              <tr key={i} className="ui-tr">
                {columns.map((col) => (
                  <td key={col.key} className="ui-td">
                    <div className="ui-skeleton-line" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="ui-th">{col.label}</th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="ui-table-empty">
          <p className="ui-empty-message">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1;

  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="ui-th">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              className={`ui-tr ${onRowClick ? 'ui-tr-clickable' : ''}`}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="ui-td">
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && totalPages > 1 && (
        <div className="ui-pagination">
          <span className="ui-pagination-info">
            Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </span>
          <div className="ui-pagination-controls">
            <button
              className="ui-page-btn"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              ← Prev
            </button>
            <span className="ui-page-current">Page {pagination.page} / {totalPages}</span>
            <button
              className="ui-page-btn"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
