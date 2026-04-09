import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, pageSize, onPageSizeChange, totalItems }) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="delivery-logs-pagination">
      <div className="delivery-logs-pagination__left">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="admin-btn-secondary delivery-logs-pagination__btn"
        >
          Previous
        </button>

        <span className="delivery-logs-pagination__meta">
          {currentPage} of {totalPages || 1}
          {typeof totalItems === 'number' ? ` (${totalItems})` : ''}
        </span>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage === totalPages || totalPages === 0}
          className="admin-btn-secondary delivery-logs-pagination__btn"
        >
          Next
        </button>
      </div>

      <div className="delivery-logs-pagination__right">
        <span>Show :</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="admin-input-control delivery-logs-pagination__select"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </div>
    </div>
  );
};

export default Pagination;