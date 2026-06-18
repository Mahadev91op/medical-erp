"use client";
import { useState, useEffect, useRef } from "react";
import { X, Sparkles, Send, Bot, User, CornerDownLeft, Table } from "lucide-react";
import toast from "react-hot-toast";

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: "👋 Hello! I am your **MedERP AI Assistant**.\n\nYou can ask me questions about your sales, medicine stock, expiry dates, registered distributors, or customer dues (udhaar) in real-time. I operate on a **read-only database engine**, ensuring your data is safe and cannot be modified.\n\nTry asking me one of these queries:",
      isWelcome: true
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Toggle or open based on custom event from header or logo
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-ai-chatbot", handleOpen);
    return () => window.removeEventListener("open-ai-chatbot", handleOpen);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Debounced autocomplete suggestions API fetch
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = inputValue.trim();
      if (q.length >= 2) {
        try {
          const res = await fetch(`/api/ai/autocomplete?q=${encodeURIComponent(q)}`);
          const data = await res.json();
          if (data.success) {
            setSuggestions(data.suggestions);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error("Autocomplete fetch error:", error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    if (!textToSend) {
      setInputValue("");
    }

    const userMessageId = Date.now().toString();
    setMessages((prev) => [...prev, { id: userMessageId, sender: "user", text: query }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query })
      });
      const data = await res.json();
      
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: data.reply || "Kuch error aaya. Koshish karein dobara poochne ki."
        }
      ]);
    } catch (error) {
      toast.error("AI Assistant is offline");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: "⚠️ Connecting issue. Kripya check karein ki server chal raha hai ya nahi."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestionChips = [
    { label: "📊 Today's Sales", query: "sales" },
    { label: "⚠️ Stock Warning", query: "stock" },
    { label: "⏳ Expiry Alerts", query: "expiry" },
    { label: "📖 Credit Book (Udhar)", query: "udhar" },
    { label: "🔥 Top Selling Today", query: "best" }
  ];

  // Helper to parse markdown-like table
  const parseTable = (lines) => {
    // lines is array of strings starting with |
    const rows = lines.map(line => {
      return line.split("|")
        .map(cell => cell.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1); // remove first and last empty cells
    });

    if (rows.length < 2) return null;

    const headers = rows[0];
    const dataRows = rows.slice(2); // Skip separator row (e.g. |:---|:---|)

    return (
      <div className="overflow-x-auto my-3 border border-slate-100 rounded-xl max-w-full">
        <table className="min-w-full text-xs text-left text-slate-700">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-2.5 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dataRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-slate-50/50 transition-colors">
                {row.map((cell, cellIdx) => {
                  // If it starts/ends with **, render as bold
                  const isBold = cell.startsWith("**") && cell.endsWith("**");
                  const content = isBold ? cell.slice(2, -2) : cell;
                  return (
                    <td key={cellIdx} className={`px-4 py-2.5 ${isBold ? 'font-extrabold text-blue-600' : ''}`}>
                      {content}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper to render text with bold formatting and lists
  const renderFormattedText = (text) => {
    if (!text) return null;

    const lines = text.split("\n");
    const elements = [];
    let tableBuffer = [];
    let isInsideTable = false;

    const renderBoldText = (str) => {
      // Replace **text** with <strong>text</strong>
      const parts = str.split(/\*\*([^*]+)\*\*/g);
      return parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i} className="font-extrabold text-slate-900">{part}</strong>;
        }
        return part;
      });
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Table Detection
      if (line.startsWith("|")) {
        isInsideTable = true;
        tableBuffer.push(line);
        continue;
      } else if (isInsideTable) {
        // Table ended
        const tableElement = parseTable(tableBuffer);
        if (tableElement) {
          elements.push(<div key={`table-${i}`}>{tableElement}</div>);
        }
        tableBuffer = [];
        isInsideTable = false;
      }

      // Headers Detection
      if (line.startsWith("###")) {
        elements.push(<h4 key={i} className="text-sm font-bold text-slate-800 mt-3 mb-1">{renderBoldText(line.slice(3).trim())}</h4>);
      } else if (line.startsWith("##")) {
        elements.push(<h3 key={i} className="text-base font-black text-slate-800 mt-4 mb-2 border-b border-slate-100 pb-1">{renderBoldText(line.slice(2).trim())}</h3>);
      } else if (line.startsWith("#")) {
        elements.push(<h2 key={i} className="text-lg font-black text-slate-900 mt-4 mb-2">{renderBoldText(line.slice(1).trim())}</h2>);
      }
      // List items
      else if (line.startsWith("-") || line.startsWith("*")) {
        elements.push(
          <li key={i} className="ml-4 list-disc text-xs text-slate-700 leading-relaxed my-0.5">
            {renderBoldText(line.substring(1).trim())}
          </li>
        );
      } 
      // Numbered List
      else if (/^\d+\./.test(line)) {
        const index = line.indexOf(".");
        const content = line.substring(index + 1).trim();
        elements.push(
          <div key={i} className="flex gap-1.5 ml-2 text-xs text-slate-700 leading-relaxed my-0.5">
            <span className="font-bold text-blue-600">{line.substring(0, index + 1)}</span>
            <span>{renderBoldText(content)}</span>
          </div>
        );
      }
      // Regular paragraph or line break
      else {
        if (line === "") {
          elements.push(<div key={i} className="h-2" />);
        } else {
          elements.push(
            <p key={i} className="text-xs text-slate-700 leading-relaxed my-1">
              {renderBoldText(line)}
            </p>
          );
        }
      }
    }

    // Flush any remaining tables
    if (isInsideTable && tableBuffer.length > 0) {
      const tableElement = parseTable(tableBuffer);
      if (tableElement) {
        elements.push(<div key={`table-final`}>{tableElement}</div>);
      }
    }

    return elements;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] transition-opacity duration-300 animate-in fade-in"
      />

      {/* Floating Chat Sheet Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-slate-50 shadow-2xl flex flex-col z-[210] animate-in slide-in-from-right duration-300 border-l border-slate-100">
        
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Sparkles className="text-white w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                MedERP AI Assistant
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Read-Only Engine</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="Close Assistant (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Panel area */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 touch-pan-y scrollbar-thin scrollbar-thumb-slate-200">
          {messages.map((msg) => {
            const isAI = msg.sender === "ai";
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[90%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                  isAI ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-800 text-white'
                }`}>
                  {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className="space-y-2">
                  <div className={`p-4 rounded-2xl border text-xs shadow-sm transition-all ${
                    isAI 
                      ? 'bg-white border-slate-100 text-slate-800 rounded-tl-sm' 
                      : 'bg-blue-600 border-blue-500 text-white rounded-tr-sm'
                  }`}>
                    {isAI ? (
                      <div>{renderFormattedText(msg.text)}</div>
                    ) : (
                      <p className="leading-relaxed font-semibold">{msg.text}</p>
                    )}
                  </div>
                  
                  {/* Suggestion Chips inside welcome message */}
                  {msg.isWelcome && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {suggestionChips.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(chip.query)}
                          className="bg-white hover:bg-blue-50 border border-slate-100 hover:border-blue-200 text-[11px] font-bold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing/Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center space-x-1.5">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Footer Prompt Input */}
        <div className="bg-white p-4 border-t border-slate-100 shrink-0 relative">
          
          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-2xl border border-slate-100 shadow-[0_-10px_35px_-5px_rgba(0,0,0,0.08)] overflow-hidden z-[220] max-h-56 overflow-y-auto divide-y divide-slate-50">
              {suggestions.map((item, idx) => {
                let badgeStyle = "bg-slate-100 text-slate-500";
                if (item.type === "medicine") badgeStyle = "bg-blue-50 text-blue-600 border border-blue-100/50 animate-pulse";
                else if (item.type === "customer") badgeStyle = "bg-emerald-50 text-emerald-600 border border-emerald-100/50";
                else if (item.type === "distributor") badgeStyle = "bg-amber-50 text-amber-600 border border-amber-100/50";
                
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      handleSendMessage(item.query);
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    className="flex justify-between items-center p-3 hover:bg-slate-50 cursor-pointer transition-colors border-l-4 border-transparent hover:border-blue-600"
                  >
                    <span className="text-xs font-bold text-slate-700">{item.label}</span>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${badgeStyle}`}>
                      {item.type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className="relative flex items-center bg-slate-50 focus-within:bg-white border border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 rounded-2xl px-4 py-2 transition-all"
          >
            <input 
              type="text" 
              placeholder="Ask anything about sales, stock, customers..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="bg-transparent border-none outline-none flex-1 text-base md:text-sm text-slate-800 placeholder-slate-400 font-semibold py-1.5 pr-10"
            />
            
            <button 
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-3 p-1.5 rounded-xl bg-blue-600 disabled:bg-slate-200 text-white disabled:text-slate-400 hover:bg-blue-700 transition-all cursor-pointer shadow-md disabled:shadow-none"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-2 font-semibold">
            Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Enter</kbd> to send, <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Esc</kbd> to close.
          </p>
        </div>

      </div>
    </>
  );
}
