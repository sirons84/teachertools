export interface DocumentData {
  id: string;
  title: string;
  serviceType: string;
  originalFileUrl: string;
  originalFileName: string;
  originalContent: string;
  originalHtml: string;
  explanationContent?: string | null;
  translations: TranslationData[];
  createdAt: string;
  updatedAt: string;
}

export interface TranslationData {
  id: string;
  documentId: string;
  langCode: string;
  content: string;
  html: string;
  createdAt: string;
}

export interface UploadResponse {
  success: boolean;
  documentId: string;
  viewUrl: string;
}

export interface TranslateRequest {
  documentId: string;
  targetLang: string;
}

export interface TranslateResponse {
  success: boolean;
  translation: TranslationData;
}
