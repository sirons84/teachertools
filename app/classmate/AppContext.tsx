"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ClassmateAgent,
  ClassmateConversationSummary,
  ClassmateMessage,
} from "@/types/classmate";

const BROWSER_ID_KEY = "classmate:browserId";
const LAST_AGENT_KEY = "classmate:lastAgentId";

function ensureBrowserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(BROWSER_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(BROWSER_ID_KEY, id);
  }
  return id;
}

interface AppState {
  agents: ClassmateAgent[];
  currentAgent: ClassmateAgent | null;
  selectAgent: (agent: ClassmateAgent) => void;

  currentConversationId: string | null;
  messages: ClassmateMessage[];
  isStreaming: boolean;

  conversations: ClassmateConversationSummary[];
  startNewConversation: () => void;
  loadConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;

  sendMessage: (content: string) => Promise<void>;

  pendingInput: string;
  setPendingInput: (v: string) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}

export function AppProvider({
  agents,
  children,
}: {
  agents: ClassmateAgent[];
  children: React.ReactNode;
}) {
  const [browserId, setBrowserId] = useState<string>("");
  const [currentAgent, setCurrentAgent] = useState<ClassmateAgent | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ClassmateMessage[]>([]);
  const [conversations, setConversations] = useState<ClassmateConversationSummary[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingInput, setPendingInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const streamAbortRef = useRef<AbortController | null>(null);

  // Init browserId + restore last agent
  useEffect(() => {
    const id = ensureBrowserId();
    setBrowserId(id);
    const lastAgentId = localStorage.getItem(LAST_AGENT_KEY);
    if (lastAgentId) {
      const found = agents.find((a) => a.id === lastAgentId);
      if (found) setCurrentAgent(found);
    }
  }, [agents]);

  // Load conversation list when browserId set
  const refreshConversations = useCallback(async () => {
    if (!browserId) return;
    try {
      const res = await fetch(
        `/api/classmate/conversations?browserId=${encodeURIComponent(browserId)}`
      );
      const data = await res.json();
      if (data.success) setConversations(data.conversations);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }, [browserId]);

  useEffect(() => {
    if (browserId) refreshConversations();
  }, [browserId, refreshConversations]);

  const selectAgent = useCallback((agent: ClassmateAgent) => {
    setCurrentAgent(agent);
    setCurrentConversationId(null);
    setMessages([]);
    setPendingInput("");
    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_AGENT_KEY, agent.id);
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    setPendingInput("");
  }, []);

  const loadConversation = useCallback(
    async (id: string) => {
      if (!browserId) return;
      try {
        const res = await fetch(
          `/api/classmate/conversations/${id}?browserId=${encodeURIComponent(browserId)}`
        );
        const data = await res.json();
        if (!data.success) return;
        const conv = data.conversation;
        const agent = agents.find((a) => a.id === conv.agentId);
        if (agent) setCurrentAgent(agent);
        setCurrentConversationId(conv.id);
        setMessages(conv.messages);
        setPendingInput("");
      } catch (err) {
        console.error("Failed to load conversation:", err);
      }
    },
    [browserId, agents]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      if (!browserId) return;
      try {
        await fetch(
          `/api/classmate/conversations/${id}?browserId=${encodeURIComponent(browserId)}`,
          { method: "DELETE" }
        );
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (currentConversationId === id) {
          setCurrentConversationId(null);
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to delete conversation:", err);
      }
    },
    [browserId, currentConversationId]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!browserId || !currentAgent || !content.trim() || isStreaming) return;

      const userMsg: ClassmateMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content,
        createdAt: Date.now(),
      };
      const assistantId = `a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "", createdAt: Date.now() },
      ]);
      setIsStreaming(true);

      const abort = new AbortController();
      streamAbortRef.current = abort;

      try {
        const res = await fetch("/api/classmate/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            browserId,
            agentId: currentAgent.id,
            conversationId: currentConversationId,
            message: content,
          }),
          signal: abort.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("API error");
        }

        const newConvId = res.headers.get("X-Conversation-Id");
        if (newConvId && !currentConversationId) {
          setCurrentConversationId(newConvId);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
          );
        }

        await refreshConversations();
      } catch (err: unknown) {
        const isAbort = err instanceof DOMException && err.name === "AbortError";
        if (!isAbort) {
          console.error("sendMessage error:", err);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "⚠️ 답변을 받아오지 못했어. 잠시 후 다시 시도해줄래?",
                  }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        streamAbortRef.current = null;
      }
    },
    [browserId, currentAgent, currentConversationId, isStreaming, refreshConversations]
  );

  const value = useMemo<AppState>(
    () => ({
      agents,
      currentAgent,
      selectAgent,
      currentConversationId,
      messages,
      isStreaming,
      conversations,
      startNewConversation,
      loadConversation,
      deleteConversation,
      sendMessage,
      pendingInput,
      setPendingInput,
      sidebarOpen,
      setSidebarOpen,
    }),
    [
      agents,
      currentAgent,
      selectAgent,
      currentConversationId,
      messages,
      isStreaming,
      conversations,
      startNewConversation,
      loadConversation,
      deleteConversation,
      sendMessage,
      pendingInput,
      sidebarOpen,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
