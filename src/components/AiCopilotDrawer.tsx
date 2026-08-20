import React, { useState } from 'react';
import { 
  X, 
  Bot, 
  Send, 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  MapPin, 
  Lightbulb, 
  ArrowRight,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { ChatMessage, RegionFilter, School } from '../types';
import { requestAiChat } from '../services/aiService';

interface AiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  schools: School[];
  currentFilter: RegionFilter;
  onApplyParsedFilter?: (filter: Partial<RegionFilter>) => void;
}

export const AiCopilotDrawer: React.FC<AiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  schools,
  currentFilter,
  onApplyParsedFilter
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Halo! Saya **AKTARA Intelligence Copilot** 🤖.

Saya siap membantu pimpinan dan tim bisnis AKTARA dalam:
1. 🎯 **Rekomendasi Penetrasi Pasar**: Menemukan target SMK/SMA prioritas untuk Bootcamp AI, Sertifikasi Guru, dan Kelas Industri.
2. 🗺️ **Optimasi Rute Spasial**: Merancang jadwal dan rute visitasi lapangan paling efisien antar kecamatan.
3. 💼 **Strategi Pitching & Kemitraan**: Menyiapkan argumen nilai tambah yang disesuaikan dengan profil masing-masing sekolah.

Silakan pilih skenario cepat di bawah atau ajukan pertanyaan spesifik!`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickPrompts = [
    "Rekomendasikan 3 SMK Swasta terbesar di Garut untuk Bootcamp AI",
    "Buatkan rute visitasi efisien di Tarogong Kidul & Tarogong Kaler",
    "Analisis potensi kemitraan dengan SMKN 1 Garut & SMKN 4 Bandung",
    "Cari sekolah dengan jurusan RPL & TKJ yang siswanya di atas 1000"
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const reply = await requestAiChat(
        query,
        schools,
        currentFilter,
        messages.slice(-4)
      );

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Maaf, terjadi kendala saat menganalisis: ${err?.message || 'Koneksi terputus'}. Silakan coba kembali.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#07394A] flex items-center justify-between bg-gradient-to-r from-[#07394A] via-[#0D5C75] to-[#0a475b] text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-[#D4AF37]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white">AKTARA Copilot</h3>
              <span className="text-[10px] bg-[#FAF3DA] text-[#947518] px-2 py-0.5 rounded font-bold border border-[#F2E3B1]">
                AI Strategic
              </span>
            </div>
            <p className="text-[11px] text-slate-200">
              Konsultasi Spasial & Strategi Bisnis Vokasi
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50">
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#0D5C75] text-white rounded-tr-xs shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-2xs'
              }`}
            >
              <div className="whitespace-pre-line">
                {msg.content}
              </div>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#0D5C75] bg-white border border-[#CCE3EA] rounded-xl p-3 w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0D5C75]" />
            <span className="font-medium">Copilot sedang menganalisis data GIS & demografi...</span>
          </div>
        )}

      </div>

      {/* Quick Prompts Shelf */}
      <div className="p-3 bg-white border-t border-slate-100 space-y-1.5">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-[#D4AF37]" />
          <span>Skenario Cepat:</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              className="text-[11px] text-left bg-slate-50 hover:bg-[#EBF4F7] hover:text-[#0D5C75] border border-slate-200 hover:border-[#CCE3EA] rounded-md px-2 py-1 transition-all text-slate-700 disabled:opacity-50 cursor-pointer font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Message Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Tanyakan analisis GIS atau strategi pasar..."
          className="flex-1 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5C75]/20 focus:border-[#0D5C75] focus:bg-white"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="p-2 bg-[#0D5C75] hover:bg-[#07394A] disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4 text-[#D4AF37]" />
        </button>
      </form>

    </div>
  );
};
