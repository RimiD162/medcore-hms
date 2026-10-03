import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from './Feedback';

export const DataTable = ({
  columns,
  data = [],
  loading = false,
  emptyMessage = 'No records found matching current criteria.',
  pagination,
  onPageChange,
  className = '',
  rowKey = 'id',
  onRowClick,
}) => {
  return (
    <div className={`med-table-wrapper ${className}`}>
      <div className="med-table-responsive">
        <table className="med-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  style={{ width: col.width, textAlign: col.align || 'left' }}
                  className={col.className || ''}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx}>
                      <Skeleton height="20px" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="med-table-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => (
                <tr
                  key={row[rowKey] || rIdx}
                  className={onRowClick ? 'med-table-row-clickable' : ''}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col, cIdx) => (
                    <td
                      key={col.key || cIdx}
                      style={{ textAlign: col.align || 'left' }}
                      className={col.cellClassName || ''}
                    >
                      {col.render ? col.render(row[col.dataIndex], row, rIdx) : row[col.dataIndex]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="med-table-pagination">
          <span className="med-pagination-info">
            Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total records)
          </span>
          <div className="med-pagination-controls">
            <button
              type="button"
              className="med-page-btn"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>
            <span className="med-page-indicator">{pagination.page} / {pagination.totalPages}</span>
            <button
              type="button"
              className="med-page-btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              aria-label="Next Page"
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
