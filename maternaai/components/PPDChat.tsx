"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, User, MessageCircle } from 'lucide-react';

interface Message {
  role: 'assistant' | 'user';
  message: string;
  timestamp: string;
}

interface PPDChatProps {
  patientId: string;
  onComplete: (moodScore: number) => void;
  onSkip?: () => void;
}

export default function PPDChat({ patientId, onComplete, onSkip }: PPDChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize conversation
  useEffect(() => {
    const startChat = async () => {
      setIsTyping(true);
      try {
        const res = await fetch(`/api/ppd?action=start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: patientId }),
        });
        const data = await res.json();
        setMessages([{ role: 'assistant', message: data.message, timestamp: new Date().toISOString() }]);
        setConversationId(data.conversation_id);
        setQuickReplies(data.quick_replies || []);
      } catch (error) {
        console.error('Failed to start chat:', error);
      } finally {
        setIsTyping(false);
      }
    };
    startChat();
  }, [patientId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || !conversationId) return;

    const userMsg: Message = { role: 'user', message: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setQuickReplies([]);
    setIsTyping(true);

    try {
      const res = await fetch(`/api/ppd?action=respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          patient_id: patientId,
          message: text
        }),
      });
      const data = await res.json();
      
      const assistantMsg: Message = {
        role: 'assistant',
        message: data.message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);
      setQuickReplies(data.quick_replies || []);

      if (data.conversation_complete || data.crisis_flag) {
        // Finalize
        setTimeout(async () => {
          await fetch(`/api/ppd?action=complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: patientId })
          });
          // Assuming mood_score fallback for Engine 1 integration
          onComplete(3); 
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to respond:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      handleSend(transcript);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col h-[500px] bg-[#FDF8F5] rounded-3xl overflow-hidden shadow-inner border border-rose-100/50 relative">
      {onSkip && (
        <button 
          onClick={onSkip}
          className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-white/80 hover:bg-white text-rose-500 text-xs font-bold rounded-full shadow-sm border border-rose-100 transition-all hover:scale-105 active:scale-95"
        >
          Skip Chat
        </button>
      )}
      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth hide-scrollbar"
      >
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: msg.role === 'assistant' ? -20 : 20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`flex items-end gap-2 max-w-[80%]`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 mb-1">
                    <MessageCircle className="w-5 h-5 text-rose-500" />
                  </div>
                )}
                <div 
                  className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'assistant' 
                    ? 'bg-white rounded-bl-none text-text-primary border border-rose-50' 
                    : 'bg-rose-500 text-white rounded-br-none'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-rose-300 rounded-full" />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-rose-300 rounded-full" />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-rose-300 rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-rose-50">
        {/* Quick Replies */}
        {quickReplies.length > 0 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
            {quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => handleSend(reply)}
                className="whitespace-nowrap px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-xs font-semibold hover:bg-rose-100 transition-colors border border-rose-100"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <button 
            onClick={toggleListening}
            className={`p-3 rounded-full transition-colors ${isListening ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-rose-50 text-rose-400 hover:bg-rose-100'}`}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
            placeholder="Type your message..."
            className="flex-1 bg-rose-50/50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-200 outline-none"
          />

          <button
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="p-3 bg-rose-500 text-white rounded-full disabled:opacity-50 disabled:bg-rose-300 transition-colors shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
