import React from 'react';

interface DetailsHeaderProps {
  onClose: () => void;
}

const DetailsHeader: React.FC<DetailsHeaderProps> = ({ onClose }) => {
  return (
    <div className="detail-header">
      <h3>Детали обращения</h3>
      <button
        className="close-btn"
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
};

export default DetailsHeader;