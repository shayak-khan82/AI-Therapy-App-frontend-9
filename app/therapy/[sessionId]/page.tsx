

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  PlusCircle,
  MessageSquare,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  createChatSession,
  sendChatMessage,
  getChatHistory,
  getAllChatSessions,
  ChatMessage,
  ChatSession,
} from "@/lib/api/chat";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function TherapyPage() {
  const params = useParams();
  const router = useRouter();

  // UI State
  const [showSidebar, setShowSidebar] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Chat State
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState(params.sessionId as string);

  /* ---------------------------
     INITIAL LOAD
  ------------------------------*/
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ---------------------------
     LOAD CHAT HISTORY
  ------------------------------*/
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);

        if (!sessionId || sessionId === "new") {
          const newId = await createChatSession();
          setSessionId(newId);
          window.history.pushState({}, "", `/therapy/${newId}`);
        } else {
          const history = await getChatHistory(sessionId);
          if (Array.isArray(history)) {
            setMessages(
              history.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
            );
          } else {
            setMessages([]);
          }
        }
      } catch (e) {
        console.error("Chat init error", e);
      } finally {
        setIsLoading(false);
      }
    };
    initChat();
  }, [sessionId]);

  /* ---------------------------
     LOAD SESSION LIST
  ------------------------------*/
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const all = await getAllChatSessions();
        setSessions(all);
      } catch (e) {
        console.error("Failed loading sessions");
      }
    };
    loadSessions();
  }, [messages]);

  /* ---------------------------
     SCROLL DOWN ON NEW MSG
  ------------------------------*/
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 75);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /* ---------------------------
     HANDLE SUBMIT
  ------------------------------*/
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!message) return;

    const text = message.trim();
    if (!text) return;

    setMessage("");
    setIsTyping(true);

    // push user message
    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await sendChatMessage(sessionId, text);

      const aiMsg: ChatMessage = {
        role: "assistant",
        content: res?.response || res?.message || "I'm here to support you.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong. Try again.",
          timestamp: new Date(),
        },
      ]);
    }

    setIsTyping(false);
  };

  /* ---------------------------
     NEW SESSION
  ------------------------------*/
  const createNew = async () => {
    const newId = await createChatSession();
    setSessionId(newId);
    setMessages([]);
    window.history.pushState({}, "", `/therapy/${newId}`);
    setShowSidebar(false);
  };

  /* ---------------------------
     COMPONENT UI
  ------------------------------*/

  if (!mounted || isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );

  return (
    <div className="relative w-full h-screen flex overflow-hidden bg-background">
      {/* ===== SIDEBAR (Desktop) ===== */}
      <div className="hidden md:flex w-72 border-r flex-col bg-muted/20">
        <Sidebar
          sessions={sessions}
          createNew={createNew}
          sessionId={sessionId}
          setSessionId={setSessionId}
        />
      </div>

      {/* ===== SIDEBAR (Mobile Drawer) ===== */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed top-0 left-0 z-50 w-72 h-full bg-background border-r shadow-xl md:hidden"
          >
            <Sidebar
              sessions={sessions}
              createNew={createNew}
              sessionId={sessionId}
              setSessionId={setSessionId}
              onClose={() => setShowSidebar(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MAIN CHAT AREA ===== */}
      <div className="flex-1 flex flex-col w-full h-full">
        {/* Header */}
        <div className="p-3 border-b flex items-center justify-between bg-background/80 backdrop-blur">
          <div className="flex items-center gap-2">
            {/* MOBILE BURGER BUTTON */}
            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => setShowSidebar(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              <h2 className="font-semibold text-lg">AI Therapist</h2>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full py-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "px-4 py-3",
                  msg.role === "assistant"
                    ? "bg-muted/40"
                    : "bg-background"
                )}
              >
                <MessageBubble msg={msg} />
              </div>
            ))}
            {isTyping && (
              <div className="px-4 py-3 bg-muted/40">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-3 border-t bg-background/90 backdrop-blur flex gap-2"
        >
          <textarea
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message the therapist..."
            className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 focus:outline-none"
          />
          <Button className="rounded-xl" type="submit" disabled={!message.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ================================
   SIDEBAR COMPONENT
================================ */
function Sidebar({ sessions, sessionId, setSessionId, createNew, onClose }: any) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">Sessions</h2>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <Button
        className="m-3"
        variant="outline"
        onClick={createNew}
      >
        <PlusCircle className="w-4 h-4 mr-2" /> New Session
      </Button>

      <ScrollArea className="flex-1 px-3 pb-6">
        {sessions.map((s: ChatSession) => (
          <div
            key={s.sessionId}
            onClick={() => {
              setSessionId(s.sessionId);
              onClose?.();
            }}
            className={cn(
              "p-3 rounded-md cursor-pointer mb-2 hover:bg-primary/10",
              s.sessionId === sessionId && "bg-primary/20"
            )}
          >
            <div className="font-medium truncate">
              {s.messages?.[0]?.content || "New chat"}
            </div>
            <small className="text-muted-foreground block">
              {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })}
            </small>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}

/* ================================
   MESSAGE COMPONENT
================================ */
function MessageBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          "w-8 h-8 flex items-center justify-center rounded-full",
          msg.role === "assistant"
            ? "bg-primary/10 text-primary"
            : "bg-secondary text-secondary-foreground"
        )}
      >
        {msg.role === "assistant" ? <Bot /> : <User />}
      </div>

      <div className="flex-1 text-sm leading-relaxed">
        <ReactMarkdown>{msg.content}</ReactMarkdown>
      </div>
    </div>
  );
}

