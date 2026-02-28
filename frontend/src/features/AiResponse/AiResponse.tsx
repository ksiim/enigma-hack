import React from 'react';
import { Button, Spinner } from '@chakra-ui/react';

interface AiResponseProps {
  ticketId: number;
  aiResponse: string;
  isGenerating: boolean;
  onGenerate: (ticketId: number) => void;
  onSend: (ticketId: number) => void;
  onResponseChange: (ticketId: number, value: string) => void;
}

const AiResponse: React.FC<AiResponseProps> = ({
  ticketId,
  aiResponse,
  isGenerating,
  onGenerate,
  onSend,
  onResponseChange
}) => {
  return (
    <div className="ai-response">
      <h4>Проект ответа:</h4>

      {/* Показываем спиннер или textarea */}
      {isGenerating ? (
        <div className="response-spinner">
          <Spinner size="lg" />
        </div>
      ) : (
        <textarea
          className="response-editor"
          placeholder='Ответ...'
          value={aiResponse || ''}
          onChange={(e) => onResponseChange(ticketId, e.target.value)}
        />
      )}

      {/* Кнопка отправки ответа */}
      <div className="detail-actions">
        <Button
          colorPalette="blue"
          variant="surface"
          onClick={() => onGenerate(ticketId)}
          disabled={isGenerating}
        >
          {isGenerating ? 'Генерация...' : 'Сгенерировать ответ'}
        </Button>
        <Button
          onClick={() => onSend(ticketId)}
          disabled={!aiResponse || isGenerating}
        >
          Отправить
        </Button>
      </div>
    </div>
  );
};

export default AiResponse;