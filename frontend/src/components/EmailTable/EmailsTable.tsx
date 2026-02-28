import React, { useState, useEffect } from 'react';
import { Spinner } from '@chakra-ui/react';
import * as XLSX from 'xlsx';
import './EmailsTable.css';
import type { Ticket, ToneType } from './emails-table.model';
import ActionButtons from '../../features/ActionButtons/ActionsButtons';
import MessageDetails from '../../features/MessageDetails/MessageDetails';
import AiResponse from '../../features/AiResponse/AiResponse';
import DetailsHeader from '../../features/MessageDetailsHeader/MessageDetailsHeader';
import TicketsTable from '../../features/TicketsTable/TickectsTable';
import { mockTickets } from './tickets.mock';

const EmailsTable: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [aiResponses, setAiResponses] = useState<Record<number, string>>({});

  useEffect(() => {
    setTimeout(() => {
      setTickets(mockTickets);
      setLoading(false);
    }, 1000);
  }, []);

  const getToneColor = (tone: ToneType): string => {
    const icons: Record<ToneType, string> = {
      'Позитивный': 'green',
      'Нейтральный': 'orange',
      'Негативный': 'red'
    };
    return icons[tone] || 'gray';
  };

  const handleSync = (): void => {
    setSyncing(true);
    setTimeout(() => {
      console.log('Синхронизация завершена');
      setSyncing(false);
    }, 1500);
  };

  const handleGenerateResponse = (ticketId: number): void => {
    setGeneratingId(ticketId);

    setTimeout(() => {
      const mockResponses: Record<string, string> = {
        'Негативный': 'Уважаемый клиент! Приносим извинения за доставленные неудобства. Наши специалисты уже работают над решением вашей проблемы. Пожалуйста, ожидайте, мы свяжемся с вами в ближайшее время.',
        'Нейтральный': 'Здравствуйте! Благодарим за обращение. Для решения вашего вопроса нам нужно уточнить некоторые детали. Напишите, пожалуйста, удобное время для звонка.',
        'Позитивный': 'Здравствуйте! Рады, что вы обратились к нам. С удовольствием поможем вам с интеграцией. Направляем ссылку на документацию: https://docs.example.com/api'
      };

      const ticket = tickets.find(t => t.id === ticketId);
      const tone = ticket?.emotionalTone || 'Нейтральный';

      setAiResponses(prev => ({
        ...prev,
        [ticketId]: mockResponses[tone] || 'Спасибо за обращение! Мы обработаем ваш запрос и свяжемся с вами.'
      }));

      setGeneratingId(null);
    }, 2000);
  };

  const downloadCsv = async (): Promise<void> => {
    try {
      const headers = ['id;дата;фио;объект;телефон;email;заводские номера;тип приборов;эмоциональный окрас;суть вопроса'];

      const rows = tickets.map(ticket =>
        `${ticket.id};${new Date(ticket.date).toLocaleString('ru-RU')};${ticket.fullName};${ticket.object};${ticket.phone};${ticket.email};${ticket.serialNumbers};${ticket.deviceType};${ticket.emotionalTone};${ticket.issueSummary}`
      );

      const csvText = "\uFEFF" + [...headers, ...rows].join('\n');

      const blob = new Blob([csvText], {
        type: 'text/csv;charset=utf-8;'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tickets.csv';

      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    } catch (e) {
      console.error(e);
      alert('Ошибка скачивания CSV');
    }
  };

  const downloadXlsx = (): void => {
    try {
      const data = tickets.map(ticket => ({
        id: ticket.id,
        дата: new Date(ticket.date).toLocaleString('ru-RU'),
        фио: ticket.fullName,
        объект: ticket.object,
        телефон: ticket.phone,
        email: ticket.email,
        'заводские номера': ticket.serialNumbers,
        'тип приборов': ticket.deviceType,
        'эмоциональный окрас': ticket.emotionalTone,
        'суть вопроса': ticket.issueSummary,
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Обращения");

      XLSX.writeFile(workbook, "tickets.xlsx");
    } catch (e) {
      console.error(e);
      alert('Ошибка скачивания XLSX');
    }
  };

  const handleSendResponse = (ticketId: number): void => {
    setTickets((prev: Ticket[]) => prev.map((t: Ticket) =>
      t.id === ticketId
        ? { ...t, reviewedByHuman: true, status: 'Отправлено' }
        : t
    ));
    setSelectedTicket(null);
    alert('Ответ отправлен');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className='spinner-wrapper'><Spinner size="lg" /></div>;
  }

  return (
    <div className="ticket-system">
      <ActionButtons
        onSync={handleSync}
        onCsvDownload={downloadCsv}
        onXlsxDownload={downloadXlsx}
        isSyncing={syncing}
      />

      <TicketsTable
        tickets={tickets}
        selectedTicket={selectedTicket}
        syncing={syncing}
        onSelectTicket={setSelectedTicket}
        getToneColor={getToneColor}
        formatDate={formatDate}
        detailContent={
          selectedTicket ? (
            <div className="ticket-detail">
              <DetailsHeader onClose={() => setSelectedTicket(null)} />

              <div className="detail-content">
                <MessageDetails ticket={selectedTicket} formatDate={formatDate} />

                <AiResponse
                  ticketId={selectedTicket.id}
                  aiResponse={aiResponses[selectedTicket.id] || ''}
                  isGenerating={generatingId === selectedTicket.id}
                  onGenerate={handleGenerateResponse}
                  onSend={handleSendResponse}
                  onResponseChange={(id, value) =>
                    setAiResponses(prev => ({ ...prev, [id]: value }))
                  }
                />
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
};

export default EmailsTable;