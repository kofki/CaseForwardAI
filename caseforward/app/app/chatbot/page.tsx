"use client";

import { useState, useRef, useEffect } from "react";
import { Radley } from "next/font/google";
import SidebarClient from "@/components/SidebarClient";

const radley = Radley({ subsets: ["latin"], weight: "400" });

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Call the AI orchestrator
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: input }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: `msg-${Date.now()}-ai`,
          role: "assistant",
          content:
            data.response || "I encountered an error processing your request.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: `msg-${Date.now()}-error`,
          role: "assistant",
          content:
            "Sorry, I was unable to process your request. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: "An error occurred. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f0ece6]">
      <SidebarClient activePage="chatbot" />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header Section - Centered */}
        <div className="flex-shrink-0 flex items-center justify-center py-12">
          <div className="text-center">
            <h1
              className={`text-5xl font-bold text-[#4b1d1d] ${radley.className}`}
            >
              AI Assistant Chatbot
            </h1>
            <p className="text-lg text-[#4b1d1d]/80 mt-4">
              Let AI analyze evidence and draft client updates.
            </p>
            <p className="text-base text-[#4b1d1d]/70 mt-2">
              Ask about missing documents, next steps, client communication.
            </p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col px-8 pb-8">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto mb-6 flex flex-col justify-center">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-[#4b1d1d]/60">
                  Start a conversation with the AI Assistant.
                </p>
              </div>
            )}
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-md px-4 py-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-[#4b1d1d] text-white"
                        : "bg-white border border-[#e6ded3] text-[#4b1d1d]"
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#e6ded3] px-4 py-3 rounded-lg">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-[#4b1d1d] rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-[#4b1d1d] rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-[#4b1d1d] rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="flex gap-3 max-w-2xl mx-auto w-full"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Consult AI Assistant ChatBot..."
              disabled={loading}
              className="flex-1 px-5 py-4 border-2 border-[#4b1d1d] bg-white text-[#4b1d1d] placeholder:text-[#4b1d1d]/50 focus:outline-none focus:ring-2 focus:ring-[#f0a56b] rounded-full disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-14 h-14 rounded-full bg-[#4b1d1d] text-white font-bold text-lg hover:bg-[#301010] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
            >
              ↑
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
