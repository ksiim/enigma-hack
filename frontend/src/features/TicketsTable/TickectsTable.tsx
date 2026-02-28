import React from 'react';
import { Collapsible, Spinner, Table } from '@chakra-ui/react';
import { FaCircle } from 'react-icons/fa';
import type { Ticket, ToneType } from '../../components/EmailTable/emails-table.model';

interface TicketsTableProps {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  syncing: boolean;
  onSelectTicket: (ticket: Ticket) => void;
  getToneColor: (tone: ToneType) => string;
  formatDate: (date: string) => string;
  detailContent?: React.ReactNode;
}

const COLUMN_COUNT = 9;

const TicketsTable: React.FC<TicketsTableProps> = ({
  tickets,
  selectedTicket,
  syncing,
  onSelectTicket,
  getToneColor,
  formatDate,
  detailContent
}) => {
  if (syncing) {
    return (
      <div className='spinner-wrapper'>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Table.Root className="ticket-table" variant="outline" borderColor="gray.300" native>
      <Table.Header>
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
          <React.Fragment key={ticket.id}>
            <Table.Row
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
            {selectedTicket?.id === ticket.id && detailContent && (
              <Table.Row className="ticket-detail-row">
                <Table.Cell colSpan={COLUMN_COUNT} className="ticket-detail-cell">
                  <Collapsible.Root open unmountOnExit={false}>
                    <Collapsible.Content>
                      {detailContent}
                    </Collapsible.Content>
                  </Collapsible.Root>
                </Table.Cell>
              </Table.Row>
            )}
          </React.Fragment>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default TicketsTable;