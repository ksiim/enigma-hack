import React, { useState, useEffect } from 'react';
import { Spinner, Button } from '@chakra-ui/react';
import './EmailsTable.css';
import type { Ticket, ToneType } from './emails-table.model';
import ActionButtons from '../../features/ActionButtons/ActionsButtons';
import MessageDetails from '../../features/MessageDetails/MessageDetails';
import AiResponse from '../../features/AiResponse/AiResponse';
import DetailsHeader from '../../features/MessageDetailsHeader/MessageDetailsHeader';
import TicketsTable from '../../features/TicketsTable/TickectsTable';
import { mockTickets } from './tickets.mock';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

type SortOrder = 'asc' | 'desc';

const EmailsTable: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [aiResponses, setAiResponses] = useState<Record<number, string>>({});
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc'); // По умолчанию сначала новые
  // const [downloading, setDownloading] = useState<'csv' | 'xlsx' | null>(null);

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

  const downloadFile = async (type: 'csv' | 'xlsx'): Promise<void> => {
    try {      
      const endpoint = type === 'csv' 
        ? 'http://localhost:8000/api/v1/preprocessed_email/csv?skip=0&limit=1000'
        : 'http://localhost:8000/api/v1/preprocessed_email/xlsx?skip=0&limit=1000';
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': type === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Получаем blob из ответа
      const blob = await response.blob();
      
      // Создаем URL для скачивания
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'csv' ? 'tickets.csv' : 'tickets.xlsx';
      
      // Добавляем в DOM, кликаем и удаляем
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      // Освобождаем URL
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(`Ошибка скачивания ${type.toUpperCase()}:`, error);
    }
  };

  const downloadCsv = (): Promise<void> => downloadFile('csv');
  const downloadXlsx = (): Promise<void> => downloadFile('xlsx');

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

  const handleSortByDate = (): void => {
    const newSortOrder: SortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);

    const sortedTickets = [...tickets].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      return newSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setTickets(sortedTickets);
  };

  if (loading) {
    return <div className='spinner-wrapper'><Spinner size="lg" /></div>;
  }

  return (
    <div className="ticket-system">
      <div className="controls-header">
        <ActionButtons
          onSync={handleSync}
          onCsvDownload={downloadCsv}
          onXlsxDownload={downloadXlsx}
          isSyncing={syncing}
        />

        {!syncing && (
          <Button
            onClick={handleSortByDate}
            size="sm"
            className="sort-button"
          >
            {sortOrder === 'asc' ? 'Сначала старые' : 'Сначала новые'}
            {sortOrder === 'asc' ? <FaChevronUp /> : <FaChevronDown />}
          </Button>
        )}
      </div>

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