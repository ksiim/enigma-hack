import React from 'react';
import type { Ticket } from '../../components/EmailTable/emails-table.model';

interface OriginalMessageProps {
  ticket: Ticket;
  formatDate: (date: string) => string;
}

const MessageDetails: React.FC<OriginalMessageProps> = ({ ticket, formatDate }) => {
  return (
    <div className="original-message">
      <h4>Исходное сообщение:</h4>
      <p><strong>От:</strong> {ticket.fullName} ({ticket.email})</p>
      <p><strong>Телефон:</strong> {ticket.phone}</p>
      <p><strong>Объект:</strong> {ticket.object}</p>
      <p><strong>Заводские номера:</strong> {ticket.serialNumbers}</p>
      <p><strong>Тип приборов:</strong> {ticket.deviceType}</p>
      <p><strong>Дата:</strong> {formatDate(ticket.date)}</p>
      <div className="message-box">
        {ticket.originalMessage}
      </div>
    </div>
  );
};

export default MessageDetails;