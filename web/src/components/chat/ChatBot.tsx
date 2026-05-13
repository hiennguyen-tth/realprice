"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useMapStore } from "@/store/mapStore";
import { chatWithAI } from "@/lib/api";
import { clsx } from "clsx";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

interface ChatResponse {
    response: string;
    action?: {
        type: string;
        location?: string;
    };
}

export function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const { setViewport } = useMapStore();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const chatMutation = useMutation({
        mutationFn: (message: string) => chatWithAI(message) as Promise<ChatResponse>,
        onSuccess: (response: ChatResponse) => {
            const newMessage: Message = {
                id: `msg-${Date.now()}`,
                role: "assistant",
                content: response.response,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, newMessage]);

            // Handle actions
            if (response.action?.type === "moveMap" && response.action.location) {
                handleMapMove(response.action.location as string);
            }
        },
    });

    const handleSend = () => {
        if (!input.trim() || chatMutation.isPending) return;

        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            role: "user",
            content: input,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        chatMutation.mutate(input);
    };

    const handleMapMove = (location: string) => {
        // Map location names to coordinates
        const locationMap: Record<string, { latitude: number; longitude: number; zoom: number }> = {
            "bình thạnh": { latitude: 10.8141, longitude: 106.7294, zoom: 13 },
            "tân bình": { latitude: 10.7968, longitude: 106.6461, zoom: 13 },
            "hoàn kiếm": { latitude: 21.0285, longitude: 105.8542, zoom: 13 },
            "quận 1": { latitude: 10.7769, longitude: 106.6961, zoom: 13 },
        };

        const normalized = location.toLowerCase();
        for (const [key, coords] of Object.entries(locationMap)) {
            if (normalized.includes(key)) {
                setViewport({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    zoom: coords.zoom,
                    bearing: 0,
                    pitch: 0,
                });
                break;
            }
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-5 right-4 md:bottom-6 md:right-6 w-12 h-12 md:w-14 md:h-14 bg-primary hover:bg-primary-dark text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-transform active:scale-95"
                aria-label="Open chatbot"
            >
                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                )}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-20 right-4 left-4 md:left-auto md:bottom-24 md:right-6 md:w-96 h-[420px] max-h-[70svh] bg-white rounded-2xl shadow-2xl border border-border flex flex-col z-40 animate-fade-in">
                    {/* Header */}
                    <div className="bg-primary text-white px-4 py-4 rounded-t-2xl flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold">RealPrice AI Assistant</h3>
                            <p className="text-xs text-primary-light">Hỏi tôi về giá, vị trí, diện tích...</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {messages.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">
                                <p className="text-sm">Xin chào! 👋</p>
                                <p className="text-xs mt-2">Tôi có thể giúp bạn tìm kiếm bất động sản phù hợp.</p>
                                <p className="text-xs">Hãy hỏi tôi về giá, vị trí hoặc diện tích.</p>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={clsx(
                                        "flex gap-2",
                                        msg.role === "user" ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div
                                        className={clsx(
                                            "max-w-xs px-4 py-2 rounded-lg text-sm",
                                            msg.role === "user"
                                                ? "bg-primary text-white rounded-br-none"
                                                : "bg-gray-100 text-gray-900 rounded-bl-none"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        )}
                        {chatMutation.isPending && (
                            <div className="flex gap-2 justify-start">
                                <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-none">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-border p-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Nhập câu hỏi..."
                                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                disabled={chatMutation.isPending}
                            />
                            <button
                                onClick={handleSend}
                                disabled={chatMutation.isPending || !input.trim()}
                                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M16.6915026,12.4744748 L3.50612381,13.2599618 C3.19218622,13.2599618 3.03521743,13.4170592 3.03521743,13.5741566 L1.15159189,20.0151496 C0.8376543,20.8006365 0.99,21.89 1.77946707,22.52 C2.41,22.99 3.50612381,23.1 4.13399899,22.8429026 L21.714504,14.0454487 C22.6563168,13.5741566 23.1272231,12.6315722 22.9702544,11.6889879 L4.13399899,1.16346272 C3.34915502,0.9 2.40734225,1.00636533 1.77946707,1.4776575 C0.994623095,2.10604706 0.837654326,3.0486314 1.15159189,3.98 L3.03521743,10.4209931 C3.03521743,10.5780905 3.19218622,10.7351879 3.50612381,10.7351879 L16.6915026,11.5206748 C16.6915026,11.5206748 17.1624089,11.5206748 17.1624089,12.0429065 C17.1624089,12.4744748 16.6915026,12.4744748 16.6915026,12.4744748 Z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
