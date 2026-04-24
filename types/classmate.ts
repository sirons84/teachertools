export interface ClassmateAgent {
  id: string;
  icon: string;
  name: string;
  desc: string;
  model: string;
  systemPrompt: string;
  greeting: string;
  chips: string[];
}

export interface ClassmateMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface ClassmateConversationSummary {
  id: string;
  agentId: string;
  title: string;
  updatedAt: number;
}

export interface ClassmateConversationDetail extends ClassmateConversationSummary {
  messages: ClassmateMessage[];
}
