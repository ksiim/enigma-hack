export interface Ticket {
  id: number;
  date: string; // дата поступления
  fullName: string | null; // ФИО отправителя
  object: string | null; // навзание предприятия или объекта
  phone: string | null; // телефон отйавителя
  email: string; // почта отправителя
  serialNumbers: string[] | null; // номера приборов указанных в письме
  deviceType: string | null; // модель или тип устройства
  emotionalTone: ToneType; // эмоциональный тон письма
  issueSummary: string; // краткое описание проблемы или запроса
  originalMessage: string; // оригинальный текст письма
}

export type ToneType = 'Позитивный' | 'Нейтральный' | 'Негативный';
