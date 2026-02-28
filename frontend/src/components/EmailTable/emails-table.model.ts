export interface Ticket {
  id: string; // изменили с number на string, так как API отдает UUID
  date: string; // дата поступления
  fullName: string | null; // ФИО отправителя (fio из API)
  object: string | null; // название предприятия или объекта
  phone: string | null; // телефон отправителя (phone_number из API)
  email: string; // почта отправителя
  serialNumbers: string[] | null; // номера приборов указанных в письме (object_number из API - может быть строкой или массивом)
  deviceType: string | null; // модель или тип устройства (object_type из API)
  emotionalTone: ToneType; // эмоциональный тон письма (emotional_color из API)
  issueSummary: string; // краткое описание проблемы или запроса (short_question из API)
  originalMessage: string; // оригинальный текст письма (question из API)
}

export type ToneType = 'positive' | 'neutral' | 'negative' | 'angry'; // добавили angry так как есть в данных