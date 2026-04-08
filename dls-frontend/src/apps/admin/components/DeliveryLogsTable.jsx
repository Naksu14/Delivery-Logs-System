import React from 'react';
import { FaRegEye, FaRegTrashAlt } from 'react-icons/fa';
import { FaPenToSquare } from 'react-icons/fa6';

const SKELETON_ROWS = 8;

const DeliveryLogsTable = ({ deliveries, isLoading, onView, onEdit, onDelete }) => {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'delivery-logs-table__status is-pending';
      case 'Released':
        return 'delivery-logs-table__status is-released';
      default:
        return 'delivery-logs-table__status';
    }
  };

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-CA');
  };

  const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatOptionalDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-CA');
  };

  return (
    <div className="delivery-logs-table-wrap">
      <table className="delivery-logs-table">
        <thead className='uppercase'>
          <tr>
            <th>Date & Time</th>
            <th>Company</th>
            <th>Delivery Type</th>
            <th>Deliverer</th>
            <th>Courier/Supplier</th>
            <th>Description</th>
            <th>Received by</th>
            <th>Received at</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="delivery-logs-table__skeleton-row" aria-hidden="true">
                  <td><span className="delivery-logs-table__skeleton" /></td>
                  <td><span className="delivery-logs-table__skeleton" /></td>
                  <td><span className="delivery-logs-table__skeleton" /></td>
                  <td><span className="delivery-logs-table__skeleton" /></td>
                  <td><span className="delivery-logs-table__skeleton" /></td>
                  <td><span className="delivery-logs-table__skeleton" /></td>
                  <td><span className="delivery-logs-table__skeleton" /></td>
                  <td><span className="delivery-logs-table__skeleton" /></td>
                  <td><span className="delivery-logs-table__skeleton is-pill" /></td>
                  <td><span className="delivery-logs-table__skeleton is-actions" /></td>
                </tr>
              ))
            : deliveries?.length ? (
            deliveries.map((delivery) => (
            <tr key={delivery.id}>
              <td>
                <div className="delivery-logs-table__datetime">
                  <span>{formatDate(delivery.date_received)}</span>
                  <span>{formatTime(delivery.date_received)}</span>
                </div>
              </td>
              <td>{delivery.company_name || '—'}</td>
              <td>{delivery.delivery_type || '—'}</td>
              <td>{delivery.deliverer_name || '—'}</td>
              <td>{delivery.courier_type_name || delivery.delivery_partner || '—'}</td>
              <td>{delivery.description || '—'}</td>
              <td>{delivery.received_by || '—'}</td>
              <td>
                <div className="delivery-logs-table__datetime">
                  {formatOptionalDate(delivery.received_at) ? <span>{formatOptionalDate(delivery.received_at)}</span> : null}
                  {formatTime(delivery.received_at) ? <span>{formatTime(delivery.received_at)}</span> : null}
                </div>
              </td>
              <td>
                <span className={getStatusBadgeClass(delivery.is_status)}>
                  {delivery.is_status || 'Pending'}
                </span>
              </td>
              <td>
                <div className="delivery-logs-table__actions">
                  <button
                    type="button"
                    className="delivery-logs-table__action"
                    aria-label="View delivery"
                    data-tooltip="View"
                    title="View"
                    onClick={() => onView?.(delivery)}
                  >
                    <FaRegEye />
                  </button>
                  <button
                    type="button"
                    className="delivery-logs-table__action"
                    aria-label="Edit delivery"
                    data-tooltip="Edit"
                    title="Edit"
                    onClick={() => onEdit?.(delivery)}
                  >
                    <FaPenToSquare />
                  </button>
                  <button
                    type="button"
                    className="delivery-logs-table__action"
                    aria-label="Delete delivery"
                    data-tooltip="Delete"
                    title="Delete"
                    onClick={() => onDelete?.(delivery)}
                  >
                    <FaRegTrashAlt />
                  </button>
                </div>
              </td>
            </tr>
          ))
          ) : (
            <tr>
              <td colSpan={10} className="delivery-logs-table__empty">No delivery records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DeliveryLogsTable;