import React, { useState } from 'react';
import { Send, Sparkles, Bot } from 'lucide-react';

export default function AgentChat() {
    const [messages, setMessages] = useState([
        { role: 'system', text: "Avon Swarm active. I'm connected to the environment. How can we vibe-code this node today?" }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;

        setMessages(prev => [...prev, { role: 'user', text: input }]);
        setInput('');

        // Simulate Avon agent response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'system',
                text: "Integrating your request into the Swarm logic. Hit Cmd+K anytime on the Canvas to specifically target visual elements!"
            }]);
        }, 800);
    };

    return (
        <div className="h-full flex flex-col bg-[#010409] border-r border-neutral-800/80 w-80">
            <div className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-blue-500 border-b border-neutral-800/80 flex items-center gap-2 bg-[#0d1117] shadow-sm">
                <Sparkles size={14} className="animate-pulse" />
                <span>Swarm Interface</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.role === 'system' && (
                            <div className="flex items-center gap-1.5 mb-1 text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                                <Bot size={12} /> Avon
                            </div>
                        )}
                        <div className={`text-sm py-2 px-3 rounded-xl max-w-[90%] shadow-lg ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none border border-blue-500'
                                : 'bg-[#161b22] text-[#c9d1d9] border border-neutral-700/50 rounded-bl-none'
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-3 border-t border-neutral-800/80 bg-[#0d1117]">
                <div className="flex items-center bg-[#010409] border border-neutral-700/60 rounded-xl p-1 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all shadow-inner">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Message the Swarm..."
                        className="flex-1 bg-transparent text-sm text-gray-200 px-3 outline-none placeholder:text-neutral-600"
                    />
                    <button
                        onClick={handleSend}
                        className="p-2 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-lg transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
