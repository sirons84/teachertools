export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  langCode: string;
}

export interface ChatRequest {
  documentId: string;
  message: string;
  langCode: string;
}
