import React from 'react';
import { Spinner, Table } from '@chakra-ui/react';
import { FaCircle } from 'react-icons/fa';
import type { Ticket, ToneType } from '../../components/EmailTable/emails-table.model';

interface TicketsTableProps {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  syncing: boolean;
  onSelectTicket: (ticket: Ticket) => void;
  getToneColor: (tone: ToneType) => string;
  formatDate: (date: string) => string;
}

const TicketsTable: React.FC<TicketsTableProps> = ({
  tickets,
  selectedTicket,
  syncing,
  onSelectTicket,
  getToneColor,
  formatDate
}) => {
  if (syncing) {
    return (
      <div className='spinner-wrapper'>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Table.Root variant="outline" borderColor="gray.300">
      <Table.Header bg="gray.200">
        <Table.Row>
          <Table.ColumnHeader>Дата</Table.ColumnHeader>
          <Table.ColumnHeader>ФИО</Table.ColumnHeader>
          <Table.ColumnHeader>Объект</Table.ColumnHeader>
          <Table.ColumnHeader>Телефон</Table.ColumnHeader>
          <Table.ColumnHeader>Email</Table.ColumnHeader>
          <Table.ColumnHeader>Заводские номера</Table.ColumnHeader>
          <Table.ColumnHeader>Тип приборов</Table.ColumnHeader>
          <Table.ColumnHeader>Эмоц. окрас</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="end">Суть вопроса</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {tickets.map((ticket: Ticket) => (
          <Table.Row
            key={ticket.id}
            onClick={() => onSelectTicket(ticket)}
            className={`ticket-row ${selectedTicket?.id === ticket.id ? 'selected' : ''}`}>
            <Table.Cell>{formatDate(ticket.date)}</Table.Cell>
            <Table.Cell>{ticket.fullName}</Table.Cell>
            <Table.Cell>{ticket.object}</Table.Cell>
            <Table.Cell>{ticket.phone}</Table.Cell>
            <Table.Cell>{ticket.email}</Table.Cell>
            <Table.Cell>{ticket.serialNumbers}</Table.Cell>
            <Table.Cell>{ticket.deviceType}</Table.Cell>
            <Table.Cell>
              <FaCircle color={getToneColor(ticket.emotionalTone)} />
            </Table.Cell>
            <Table.Cell textAlign="end">{ticket.issueSummary}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default TicketsTable;