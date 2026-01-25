"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Radley } from "next/font/google";
import SidebarClient from "@/components/SidebarClient";

const radley = Radley({ subsets: ["latin"], weight: "400" });

// Agent types for the debriefing room
type AgentRole = 'ORCHESTRATOR' | 'CLIENT_GURU' | 'EVIDENCE_ANALYZER' | 'SETTLEMENT_VALUATOR' | 'user';

interface DebriefingMessage {
  id: string;
  role: AgentRole;
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  displayedContent?: string;
}

interface ActionCard {
  id: string;
  title: string;
  description: string;
  type: string;
  confidence: number;
  reasoning: string;
  emailBody?: string;
  missingDocuments?: string[];
  riskDetails?: string;
}

// Agent display configuration - FIXED COLORS FOR VISIBILITY
const agentConfig: Record<AgentRole, { name: string; emoji: string; color: string; bgColor: string; textColor: string }> = {
  ORCHESTRATOR: {
    name: 'Orchestrator',
    emoji: '🎯',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100 border-purple-300',
    textColor: 'text-purple-900'
  },
  CLIENT_GURU: {
    name: 'Client Guru',
    emoji: '👤',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100 border-blue-300',
    textColor: 'text-blue-900'
  },
  EVIDENCE_ANALYZER: {
    name: 'Evidence Analyzer',
    emoji: '🔍',
    color: 'text-emerald-800',
    bgColor: 'bg-emerald-100 border-emerald-300',
    textColor: 'text-emerald-900'
  },
  SETTLEMENT_VALUATOR: {
    name: 'Settlement Valuator',
    emoji: '💰',
    color: 'text-amber-800',
    bgColor: 'bg-amber-100 border-amber-300',
    textColor: 'text-amber-900'
  },
  user: {
    name: 'You',
    emoji: '👨‍💼',
    color: 'text-white',
    bgColor: 'bg-[#4b1d1d] border-[#4b1d1d]',
    textColor: 'text-white'
  },
};

// Typing effect hook
function useTypingEffect(
  messages: DebriefingMessage[],
  setDisplayMessages: React.Dispatch<React.SetStateAction<DebriefingMessage[]>>
) {
  useEffect(() => {
    const typingSpeed = 10; // ms per character

    messages.forEach((msg, msgIndex) => {
      if (msg.role === 'user') return; // Don't animate user messages

      const fullContent = msg.content;
      let charIndex = 0;

      // Delay start based on message index (sequential appearance)
      const startDelay = msgIndex * 500; // 500ms gap between specialists

      const typeNextChar = () => {
        if (charIndex <= fullContent.length) {
          setDisplayMessages(prev => {
            const updated = [...prev];
            const existingIdx = updated.findIndex(m => m.id === msg.id);
            if (existingIdx >= 0) {
              updated[existingIdx] = {
                ...updated[existingIdx],
                displayedContent: fullContent.substring(0, charIndex),
                isTyping: charIndex < fullContent.length
              };
            }
            return updated;
          });
          charIndex++;
          if (charIndex <= fullContent.length) {
            setTimeout(typeNextChar, typingSpeed);
          }
        }
      };

      setTimeout(typeNextChar, startDelay);
    });
  }, [messages, setDisplayMessages]);
}

export default function DebriefingRoomPage() {
  const [messages, setMessages] = useState<DebriefingMessage[]>([]);
  const [displayMessages, setDisplayMessages] = useState<DebriefingMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionCard, setActionCard] = useState<ActionCard | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);
  const [intentInfo, setIntentInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages]);

  // Typing effect for sequential appearance
  useEffect(() => {
    if (messages.length === 0) {
      setDisplayMessages([]);
      return;
    }

    const userMessages = messages.filter(m => m.role === 'user');
    const aiMessages = messages.filter(m => m.role !== 'user');

    // Show user messages immediately
    setDisplayMessages(userMessages.map(m => ({ ...m, displayedContent: m.content, isTyping: false })));

    // Add AI messages sequentially with typing effect
    aiMessages.forEach((msg, idx) => {
      const delay = idx * 1000; // 1 second between each specialist

      setTimeout(() => {
        setDisplayMessages(prev => {
          // Check if already added
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, { ...msg, displayedContent: '', isTyping: true }];
        });

        // Start typing animation
        const fullContent = msg.content;
        let charIndex = 0;
        const typeSpeed = 8; // fast for long messages

        const typeInterval = setInterval(() => {
          charIndex += 3; // Type 3 chars at a time for speed
          if (charIndex >= fullContent.length) {
            charIndex = fullContent.length;
            clearInterval(typeInterval);
          }

          setDisplayMessages(prev => {
            return prev.map(m =>
              m.id === msg.id
                ? { ...m, displayedContent: fullContent.substring(0, charIndex), isTyping: charIndex < fullContent.length }
                : m
            );
          });
        }, typeSpeed);

      }, delay);
    });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: DebriefingMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
      displayedContent: input,
      isTyping: false,
    };

    setMessages([userMessage]); // Reset to just user message
    setDisplayMessages([userMessage]);
    setInput("");
    setLoading(true);
    setActionCard(null);
    setIntentInfo(null);

    try {
      const response = await fetch("/api/debriefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: input }),
      });

      if (response.ok) {
        const data = await response.json();

        // Set intent info
        if (data.intent) {
          setIntentInfo(data.intent);
        }

        // Add agent discussion messages
        if (data.history && Array.isArray(data.history)) {
          const agentMessages: DebriefingMessage[] = data.history.map((msg: any, idx: number) => ({
            id: `msg-${Date.now()}-${idx}`,
            role: msg.role as AgentRole,
            content: msg.content,
            timestamp: new Date(),
            displayedContent: '',
            isTyping: true,
          }));
          setMessages([userMessage, ...agentMessages]);
        }

        // Set action card if present (only for action intents)
        if (data.actionCard) {
          // Delay showing action card until typing is done
          const totalDelay = (data.history?.length || 1) * 1500;
          setTimeout(() => {
            setActionCard(data.actionCard);
          }, totalDelay);
        }

        if (data.caseNumber) {
          setCaseNumber(data.caseNumber);
        }

      } else {
        const errorMessage: DebriefingMessage = {
          id: `msg-${Date.now()}-error`,
          role: "ORCHESTRATOR",
          content: "I apologize, but I encountered an issue processing your request. Please try again.",
          timestamp: new Date(),
          displayedContent: "I apologize, but I encountered an issue processing your request. Please try again.",
          isTyping: false,
        };
        setMessages([userMessage, errorMessage]);
      }
    } catch {
      const errorMessage: DebriefingMessage = {
        id: `msg-${Date.now()}-error`,
        role: "ORCHESTRATOR",
        content: "A connection error occurred. Please check your network and try again.",
        timestamp: new Date(),
        displayedContent: "A connection error occurred. Please check your network and try again.",
        isTyping: false,
      };
      setMessages([userMessage, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f5f2ed]">
      <SidebarClient activePage="chatbot" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-6 border-b border-[#d4cdc2] bg-white">
          <div>
            <h1 className={`text-4xl font-bold text-[#4b1d1d] ${radley.className}`}>
              Debriefing Room
            </h1>
            <p className="text-base text-gray-600 mt-1">
              AI specialists collaborate on your case questions
            </p>
          </div>
          <div className="flex items-center gap-4">
            {intentInfo && (
              <div className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                Intent: <span className="font-medium">{intentInfo.intent?.replace(/_/g, ' ')}</span>
                {intentInfo.isQuery && <span className="ml-2 text-blue-600">(Query)</span>}
              </div>
            )}
            {caseNumber && (
              <div className="bg-[#4b1d1d] text-white px-4 py-2 rounded-lg">
                <span className="text-sm opacity-80">Active Case:</span>
                <span className="ml-2 font-semibold">{caseNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Specialists Panel */}
        <div className="flex-shrink-0 px-8 py-3 bg-gray-50 border-b border-[#d4cdc2]">
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-500 font-medium">Available specialists:</span>
            <div className="flex gap-4">
              {(['ORCHESTRATOR', 'CLIENT_GURU', 'EVIDENCE_ANALYZER', 'SETTLEMENT_VALUATOR'] as const).map((role) => (
                <div key={role} className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{agentConfig[role].emoji}</span>
                  <span className={`font-medium ${agentConfig[role].color}`}>
                    {agentConfig[role].name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Discussion Area */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-[#f5f2ed]">
          {displayMessages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">🤝</div>
              <h2 className={`text-2xl text-[#4b1d1d] ${radley.className} mb-2`}>
                Welcome to the Debriefing Room
              </h2>
              <p className="text-gray-600 max-w-md">
                Ask a question about any case and our AI specialists will collaborate to find the best answer.
              </p>
              <p className="text-gray-400 text-sm mt-4">
                Tip: Include a case number (like CF-123456) for case-specific analysis
              </p>
            </div>
          )}

          <div className="space-y-4 max-w-4xl mx-auto">
            {displayMessages.map((msg) => {
              const config = agentConfig[msg.role];
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-2xl ${isUser ? 'order-2' : 'order-1'}`}>
                    {/* Agent label */}
                    {!isUser && (
                      <div className={`flex items-center gap-2 mb-1 ${config.color}`}>
                        <span className="text-lg">{config.emoji}</span>
                        <span className="text-sm font-semibold">{config.name}</span>
                        {msg.isTyping && (
                          <span className="text-xs text-gray-400 italic ml-2">thinking...</span>
                        )}
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`px-4 py-3 rounded-lg border shadow-sm ${config.bgColor}`}
                    >
                      <p className={`text-sm whitespace-pre-wrap ${config.textColor}`}>
                        {msg.displayedContent || msg.content}
                        {msg.isTyping && <span className="animate-pulse">▋</span>}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && displayMessages.length <= 1 && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-lg">🎯</span>
                    <span className="text-sm font-medium">Orchestrator</span>
                    <span className="text-xs text-gray-400 italic ml-2">analyzing your request...</span>
                    <div className="flex gap-1 ml-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Card (when available - only for action intents) */}
            {actionCard && (
              <div className="bg-white border-2 border-[#f0a56b] rounded-xl p-6 shadow-lg mt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs text-[#f0a56b] font-semibold uppercase tracking-wide">
                      Recommended Action
                    </span>
                    <h3 className={`text-xl text-[#4b1d1d] ${radley.className} mt-1`}>
                      {actionCard.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Confidence:</span>
                    <span className="font-bold text-[#4b1d1d]">
                      {Math.round(actionCard.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{actionCard.description}</p>

                {actionCard.reasoning && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <span className="text-xs text-gray-500 font-semibold uppercase">Reasoning</span>
                    <p className="text-sm text-gray-700 mt-1">{actionCard.reasoning}</p>
                  </div>
                )}

                {actionCard.emailBody && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <span className="text-xs text-blue-700 font-semibold uppercase">Draft Email</span>
                    <p className="text-sm text-blue-900 mt-2 whitespace-pre-wrap">{actionCard.emailBody}</p>
                  </div>
                )}

                {actionCard.missingDocuments && actionCard.missingDocuments.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                    <span className="text-xs text-amber-700 font-semibold uppercase">Missing Documents</span>
                    <ul className="mt-2 space-y-1">
                      {actionCard.missingDocuments.map((doc, i) => (
                        <li key={i} className="text-sm text-amber-900 flex items-center gap-2">
                          <span>📄</span> {doc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Swipe buttons */}
                <div className="flex gap-4 mt-6">
                  <button className="flex-1 py-3 px-6 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border border-red-200">
                    <span>←</span> Pass
                  </button>
                  <button className="flex-1 py-3 px-6 bg-green-100 hover:bg-green-200 text-green-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 border border-green-200">
                    Accept <span>→</span>
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 px-8 py-6 border-t border-[#d4cdc2] bg-white">
          <form
            onSubmit={handleSendMessage}
            className="flex gap-3 max-w-3xl mx-auto"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question (include case number for specific analysis)..."
              disabled={loading}
              className="flex-1 px-5 py-4 border-2 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f0a56b] focus:border-[#f0a56b] rounded-full disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-14 h-14 rounded-full bg-[#4b1d1d] text-white font-bold text-lg hover:bg-[#301010] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg transition-colors"
            >
              ↑
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
