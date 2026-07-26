import React, { useState, useRef, useEffect } from 'react'
import { chatWithReport } from '../utils/api'

export default function ChatWidget({ reportId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isSending, isOpen])

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 300)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isSending) return

    const priorHistory = messages.map(({ role, content }) => ({ role, content }))
    const userMessage = { role: 'user', content: trimmed }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setError(null)
    setIsSending(true)

    try {
      const res = await chatWithReport(reportId, trimmed, priorHistory)
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }])
    } catch (err) {
      console.error('Chat request failed', err)
      setError(err?.response?.data?.detail || err.message || 'Failed to get a response. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary-container text-on-primary shadow-lg hover:bg-primary-container/85 transition-all flex items-center justify-center cursor-pointer"
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      >
        <span className="material-symbols-outlined text-2xl">
          {isOpen ? 'close' : 'smart_toy'}
        </span>
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-sm h-[520px] max-h-[70vh] glass-panel rounded-2xl shadow-2xl flex flex-col overflow-hidden text-left">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-outline-variant/30 shrink-0">
            <span className="material-symbols-outlined text-primary text-xl">smart_toy</span>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-on-surface">AI Assistant</h3>
              <span className="text-[10px] text-on-surface-variant tech-mono">Ask about this report</span>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center h-full text-on-surface-variant space-y-2 px-4">
                <span className="material-symbols-outlined text-3xl opacity-50">chat_bubble</span>
                <p className="text-xs leading-relaxed">
                  Ask me anything about this pull request's risk score, files, or findings.
                </p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-primary-container text-on-primary rounded-br-sm'
                      : 'bg-surface-bright/20 border border-outline-variant/20 text-on-surface rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-surface-bright/20 border border-outline-variant/20 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-on-surface-variant/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-on-surface-variant/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-on-surface-variant/60 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2 bg-error/10 border border-error/20 rounded-xl text-error text-xs">
                <span className="material-symbols-outlined text-sm shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-outline-variant/30 p-3 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                maxLength={4000}
                disabled={isSending}
                className="flex-1 resize-none max-h-24 bg-surface-bright/10 border border-outline-variant/30 rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary/50 transition-all"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !input.trim()}
                className="w-9 h-9 shrink-0 rounded-xl bg-primary-container text-on-primary flex items-center justify-center hover:bg-primary-container/85 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
