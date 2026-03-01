import React, { useState, useEffect } from 'react';
import { Spinner, Button } from '@chakra-ui/react';
import './EmailsTable.css';
import type { Ticket, ToneType } from './emails-table.model';
import ActionButtons from '../../features/ActionButtons/ActionsButtons';
import MessageDetails from '../../features/MessageDetails/MessageDetails';
import AiResponse from '../../features/AiResponse/AiResponse';
import DetailsHeader from '../../features/MessageDetailsHeader/MessageDetailsHeader';
import TicketsTable from '../../features/TicketsTable/TickectsTable';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

type SortOrder = 'asc' | 'desc';

interface ApiResponse {
  data: ApiTicket[];
  count: number;
}

interface ApiTicket {
  id: string;
  date: string;
  fio: string | null;
  object: string | null;
  object_number: string | null;
  object_type: string | null;
  phone_number: string | null;
  email: string;
  emotional_color: string;
  question: string;
  short_question: string;
}

// interface AiResponseData {
//   help_answer: string;
//   preprocessed_email_id: string;
// }

const EmailsTable: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({});
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageSize] = useState<number>(5);
  

  const fetchTickets = async (skip: number = 0, limit: number = 3) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/v1/preprocessed_email/?skip=${skip}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      const transformedTickets: Ticket[] = data.data.map(apiTicket => ({
        id: apiTicket.id,
        date: apiTicket.date,
        fullName: apiTicket.fio,
        object: apiTicket.object,
        phone: apiTicket.phone_number,
        email: apiTicket.email,
        serialNumbers: apiTicket.object_number ? [apiTicket.object_number] : null,
        deviceType: apiTicket.object_type,
        emotionalTone: mapEmotionalColor(apiTicket.emotional_color),
        issueSummary: apiTicket.short_question,
        originalMessage: apiTicket.question,
      }));

      const TEMPORAL_COUNT = 16
      
      setTickets(transformedTickets);
      // setTotalPages(Math.ceil(data.count / limit));
      setTotalPages(Math.ceil(TEMPORAL_COUNT / limit));
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки тикетов:', error);
      setLoading(false);
    }
  };

  const mapEmotionalColor = (color: string): ToneType => {
    switch (color.toLowerCase()) {
      case 'positive':
        return 'positive';
      case 'neutral':
        return 'neutral';
      case 'negative':
        return 'negative';
      case 'angry':
        return 'negative';
      default:
        return 'neutral';
    }
  };

  useEffect(() => {
    fetchTickets(0, pageSize);
  }, []);

  const getToneColor = (tone: ToneType): string => {
    const icons: Record<ToneType, string> = {
      'positive': 'green',
      'neutral': 'orange',
      'negative': 'red',
      'angry': 'red'
    };
    return icons[tone] || 'gray';
  };

  const handleSync = (): void => {
    setSyncing(true);
    fetchTickets(0, pageSize).then(() => {
      setSyncing(false);
      setCurrentPage(0);
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const skip = newPage * pageSize;
    fetchTickets(skip, pageSize);
    setSelectedTicket(null);
  };

  const handleGenerateResponse = async (ticketId: string): Promise<void> => {
  try {
    setGeneratingId(ticketId);
    
    const response = await fetch(`http://localhost:8000/api/v1/preprocessed_email/help-answer?preprocessed_email_id=${ticketId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Получаем строку с экранированными символами
    const rawData = await response.text();
    
    // Убираем внешние кавычки, если они есть
    const cleanedData = rawData.replace(/^"|"$/g, '');
    
    // Заменяем экранированные символы на реальные
    const formattedData = cleanedData
      .replace(/\\n/g, '\n')  // Заменяем \n на реальные переносы строк
      .replace(/\\"/g, '"')    // Заменяем экранированные кавычки
      .replace(/\\t/g, '\t');  // Заменяем табуляцию, если есть
    
    console.log('Отформатированный ответ:', formattedData);
    
    setAiResponses(prev => ({
      ...prev,
      [ticketId]: formattedData,
    }));

  } catch (error) {
    console.error('Ошибка генерации ответа:', error);
    
    setAiResponses(prev => ({
      ...prev,
      [ticketId]: 'Извините, не удалось сгенерировать ответ. Попробуйте позже.',
    }));
    
  } finally {
    setGeneratingId(null);
  }
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

      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'csv' ? 'tickets.csv' : 'tickets.xlsx';
      
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(`Ошибка скачивания ${type.toUpperCase()}:`, error);
    }
  };

  const downloadCsv = (): Promise<void> => downloadFile('csv');
  const downloadXlsx = (): Promise<void> => downloadFile('xlsx');

  const handleSendResponse = (ticketId: string): void => {
    setTickets((prev: Ticket[]) => prev.map((t: Ticket) =>
      t.id === ticketId
        ? { ...t, reviewedByHuman: true, status: 'Отправлено' }
        : t
    ));
    setSelectedTicket(null);
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

  if (loading && tickets.length === 0) {
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
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
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