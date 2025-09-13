// import React from 'react';
//
// const StatusIndicator = ({ status }) => {
//   const getStatusColor = () => {
//     switch (status) {
//       case 'running':
//         return '#27ae60'; // Green
//       case 'stopped':
//         return '#e74c3c'; // Red
//       default:
//         return '#95a5a6'; // Gray
//     }
//   };
//
//   return (
//     <div className="status-indicator">
//       <div
//         className="indicator-light"
//         style={{ backgroundColor: getStatusColor() }}
//       />
//       <span className="status-text">
//           <strong>{status}</strong>
//       </span>
//     </div>
//   );
// };
//
// export default StatusIndicator;

import React from 'react';

const StatusIndicator = ({ status }) => {
  const getStatusText = () => {
    switch (status) {
      case 'running':
        return 'Kafka is Running';
      case 'stopped':
        return 'Kafka is Stopped';
      default:
        return 'Kafka Status Unknown';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return '#27ae60'; // Green
      case 'stopped':
        return '#e74c3c'; // Red
      default:
        return '#95a5a6'; // Gray
    }
  };

  return (
    <div className="status-indicator">
      <div
        className="indicator-light"
        style={{ backgroundColor: getStatusColor() }}
      />
      <span className="status-text">
        {getStatusText()}
      </span>
    </div>
  );
};

export default StatusIndicator;
