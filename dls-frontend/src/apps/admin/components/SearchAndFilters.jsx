import React from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';

const SearchAndFilters = ({ search, status, type, deliveryTypeOptions = [], setSearch, setStatus, setType }) => {
  return (
    <div className="delivery-logs-filters">
      <div className="delivery-logs-filters__search-wrap">
        <FaSearch className="delivery-logs-filters__search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search Deliveries"
          className="admin-input-control delivery-logs-filters__search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search deliveries"
        />
        {search ? (
          <button
            type="button"
            className="delivery-logs-filters__clear-btn"
            onClick={() => setSearch('')}
            aria-label="Clear search"
          >
            <FaTimes />
          </button>
        ) : null}
      </div>

      <div className="delivery-logs-filters__selects">
        <select
          className="admin-input-control delivery-logs-filters__select"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All Types</option>
          {deliveryTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          className="admin-input-control delivery-logs-filters__select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Released">Released</option>
        </select>
      </div>
    </div>
  );
};

export default SearchAndFilters;