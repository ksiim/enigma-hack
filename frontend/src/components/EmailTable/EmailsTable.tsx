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
  object_number: string | null; // В API это строка, но в нашей модели массив
  object_type: string | null;
  phone_number: string | null;
  email: string;
  emotional_color: string; // positive, neutral, negative, angry
  question: string;
  short_question: string;
}

const EmailsTable: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null); // изменили на string
  const [aiResponses, setAiResponses] = useState<Record<string, string>>({}); // изменили на string
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  // const [downloading, setDownloading] = useState<'csv' | 'xlsx' | null>(null);
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState<number>(0);
  // const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageSize] = useState<number>(3); // по 3 элемента на страницу
  

  const fetchTickets = async (skip: number = 0, limit: number = 3) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/v1/preprocessed_email/?skip=${skip}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      // Преобразуем API ответ в наш формат Ticket
      const transformedTickets: Ticket[] = data.data.map(apiTicket => ({
        id: apiTicket.id,
        date: apiTicket.date,
        fullName: apiTicket.fio,
        object: apiTicket.object,
        phone: apiTicket.phone_number,
        email: apiTicket.email,
        // Преобразуем object_number в массив, если это строка
        serialNumbers: apiTicket.object_number ? [apiTicket.object_number] : null,
        deviceType: apiTicket.object_type,
        // Маппинг emotional_color на ToneType
        emotionalTone: mapEmotionalColor(apiTicket.emotional_color),
        issueSummary: apiTicket.short_question,
        originalMessage: apiTicket.question,
      }));
      
      setTickets(transformedTickets);
      // setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / limit));
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки тикетов:', error);
      setLoading(false);
    }
  };

  // Функция для маппинга emotional_color из API в ToneType
  const mapEmotionalColor = (color: string): ToneType => {
    switch (color.toLowerCase()) {
      case 'positive':
        return 'positive';
      case 'neutral':
        return 'neutral';
      case 'negative':
        return 'negative';
      case 'angry':
        return 'negative'; // маппим angry на negative для совместимости с UI
      default:
        return 'neutral';
    }
  };

  useEffect(() => {
    fetchTickets(0, pageSize);
  }, []); // Загружаем при монтировании

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
    // При синхронизации перезагружаем первую страницу
    fetchTickets(0, pageSize).then(() => {
      setSyncing(false);
      setCurrentPage(0);
    });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    const skip = newPage * pageSize;
    fetchTickets(skip, pageSize);
    setSelectedTicket(null); // Сбрасываем выбранный тикет при смене страницы
  };

  const handleGenerateResponse = (ticketId: string): void => {
    setGeneratingId(ticketId);

    setTimeout(() => {
      const mockResponses: Record<string, string> = {
        'negative': 'Уважаемый клиент! Приносим извинения за доставленные неудобства. Наши специалисты уже работают над решением вашей проблемы. Пожалуйста, ожидайте, мы свяжемся с вами в ближайшее время.',
        'neutral': 'Здравствуйте! Благодарим за обращение. Для решения вашего вопроса нам нужно уточнить некоторые детали. Напишите, пожалуйста, удобное время для звонка.',
        'positive': 'Здравствуйте! Рады, что вы обратились к нам. С удовольствием поможем вам с интеграцией. Направляем ссылку на документацию: https://docs.example.com/api'
      };

      const ticket = tickets.find(t => t.id === ticketId);
      const tone = ticket?.emotionalTone || 'neutral';

      setAiResponses(prev => ({
        ...prev,
        [ticketId]: mockResponses[tone] || 'Спасибо за обращение! Мы обработаем ваш запрос и свяжемся с вами.'
      }));

      setGeneratingId(null);
    }, 2000);
  };

  const downloadFile = async (type: 'csv' | 'xlsx'): Promise<void> => {
    try {      
      // setDownloading(type);
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
    } finally {
      // setDownloading(null);
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
          // isDownloading={downloading}
        />

        {!syncing && (
          <Button
            onClick={handleSortByDate}
            size="sm"
            className="sort-button"
            // isDisabled={!!downloading}
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