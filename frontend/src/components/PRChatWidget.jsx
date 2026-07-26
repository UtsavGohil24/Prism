import React, { useState, useRef, useEffect, useCallback } from 'react'
import { chatWithReport } from '../utils/api'

function ChatSparkleIcon({ size = 26 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="
          M4.5 2H19.5Q22.5 2 22.5 5V14Q22.5 17 19.5 17H8.5L4 21.5L4 17Q2 17 2 14V5Q2 2 4.5 2Z
          M7 5.9L7.45 7.05L8.6 7.5L7.45 7.95L7 9.1L6.55 7.95L5.4 7.5L6.55 7.05Z
          M16.5 4.8L17.12 6.38L18.7 7L17.12 7.62L16.5 9.2L15.88 7.62L14.3 7L15.88 6.38Z
          M9 11.5L9.42 12.58L10.5 13L9.42 13.42L9 14.5L8.58 13.42L7.5 13L8.58 12.58Z
        "
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Lightweight inline markdown renderer
// Handles: **bold**, `inline code`, ```code blocks```, bullet lists, line breaks
// No external dependency needed.
// ---------------------------------------------------------------------------
function renderMarkdown(text) {
  if (!text) return []
  const lines = text.split('\n')
  const elements = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      const lang = line.replace(/^```/, '').trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // consume closing ```
      elements.push(
        <pre key={key++} className="my-2 rounded-lg bg-surface-lowest/80 border border-outline-variant/30 p-3 overflow-x-auto text-xs font-mono text-on-surface leading-relaxed">
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      continue
    }

    // Bullet list item
    if (/^(\s*[-*+]\s)/.test(line)) {
      elements.push(
        <div key={key++} className="flex items-start gap-1.5 my-0.5">
          <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
          <span>{inlineMarkdown(line.replace(/^\s*[-*+]\s/, ''), key++)}</span>
        </div>
      )
      i++
      continue
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)[1]
      elements.push(
        <div key={key++} className="flex items-start gap-1.5 my-0.5">
          <span className="text-primary text-xs font-bold shrink-0 mt-0.5">{num}.</span>
          <span>{inlineMarkdown(line.replace(/^\d+\.\s/, ''), key++)}</span>
        </div>
      )
      i++
      continue
    }

    // Empty line — spacer
    if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />)
      i++
      continue
    }

    // Normal paragraph line
    elements.push(
      <p key={key++} className="my-0.5 leading-relaxed">
        {inlineMarkdown(line, key++)}
      </p>
    )
    i++
  }

  return elements
}

// Inline markdown: **bold**, *italic*, `code`
function inlineMarkdown(text, baseKey) {
  const parts = []
  // Split on **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g
  let last = 0
  let match
  let k = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={`${baseKey}-t${k++}`}>{text.slice(last, match.index)}</span>)
    }
    if (match[0].startsWith('**')) {
      parts.push(<strong key={`${baseKey}-b${k++}`} className="font-bold text-on-surface">{match[2]}</strong>)
    } else if (match[0].startsWith('*')) {
      parts.push(<em key={`${baseKey}-i${k++}`} className="italic">{match[3]}</em>)
    } else if (match[0].startsWith('`')) {
      parts.push(
        <code key={`${baseKey}-c${k++}`} className="bg-surface-lowest/80 border border-outline-variant/30 rounded px-1 py-0.5 text-[11px] font-mono text-primary">
          {match[4]}
        </code>
      )
    }
    last = match.index + match[0].length
  }

  if (last < text.length) {
    parts.push(<span key={`${baseKey}-t${k++}`}>{text.slice(last)}</span>)
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}

// ---------------------------------------------------------------------------
// Typing indicator (animated dots)
// ---------------------------------------------------------------------------
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <span className="text-[10px] text-on-surface-variant tech-mono mr-1">thinking</span>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single chat message bubble
// ---------------------------------------------------------------------------
function ChatBubble({ role, content, isError, onRetry }) {
  const isUser = role === 'user'

  if (isError) {
    return (
      <div className="flex items-start gap-2 my-2">
        <span className="material-symbols-outlined text-error text-lg shrink-0 mt-0.5">error</span>
        <div className="glass-card rounded-xl rounded-tl-none border border-error/20 bg-error/5 p-3 flex-1">
          <p className="text-xs text-error leading-relaxed">{content}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 flex items-center gap-1 text-[10px] font-bold text-error border border-error/30 px-2 py-1 rounded-lg hover:bg-error/10 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">refresh</span>
              Retry
            </button>
          )}
        </div>
      </div>
    )
  }

  if (isUser) {
    return (
      <div className="flex justify-end my-2">
        <div className="max-w-[82%] px-3.5 py-2.5 rounded-2xl rounded-br-sm bg-primary/20 border border-primary/25 text-sm text-on-surface leading-relaxed">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 my-2">
      <div className="w-6 h-6 shrink-0 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center mt-0.5">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: '13px' }}>smart_toy</span>
      </div>
      <div className="max-w-[85%] glass-card rounded-2xl rounded-tl-sm border border-outline-variant/25 px-3.5 py-2.5 text-sm text-on-surface">
        {renderMarkdown(content)}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Example question chips
// ---------------------------------------------------------------------------
const SUGGESTED_QUESTIONS = [
  'Why is this PR high risk?',
  'Summarise the critical bugs',
  'Which files are most risky?',
  'Is this safe to merge?',
]

function EmptyState({ onChipClick }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-4 py-8 text-center">
      <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-2xl">smart_toy</span>
      </div>
      <div>
        <p className="text-sm font-bold text-on-surface mb-1">Ask anything about this PR</p>
        <p className="text-xs text-on-surface-variant leading-relaxed max-w-[240px]">
          I have full access to the risk report, bugs found, and risk factors for this pull request.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full">
        {SUGGESTED_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => onChipClick(q)}
            className="text-left text-xs px-3.5 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-lowest/40 hover:border-primary/40 hover:bg-primary/5 text-on-surface-variant hover:text-on-surface transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-primary align-middle mr-1.5" style={{ fontSize: '13px' }}>chevron_right</span>
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main chat widget
// ---------------------------------------------------------------------------
const MAX_CHARS = 4000

export default function PRChatWidget({ reportId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])         // { role, content, isError, failedMessage? }
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [panelError, setPanelError] = useState(null)   // 404-level fatal error

  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const prevReportId = useRef(reportId)

  // Reset chat when navigating to a different report
  useEffect(() => {
    if (prevReportId.current !== reportId) {
      setMessages([])
      setInput('')
      setIsLoading(false)
      setPanelError(null)
      prevReportId.current = reportId
    }
  }, [reportId])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, isOpen])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [input])

  const getHistory = useCallback((currentMessages) => {
    return currentMessages
      .filter(m => !m.isError)
      .map(m => ({ role: m.role, content: m.content }))
  }, [])

  const sendMessage = useCallback(async (text) => {
    const clean = (text ?? input).trim()
    if (!clean || isLoading) return
    if (clean.length > MAX_CHARS) return

    const userMsg = { role: 'user', content: clean }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setIsLoading(true)

    try {
      const history = getHistory(messages) // history BEFORE current user message
      const data = await chatWithReport(reportId, clean, history)
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      const status = err?.response?.status
      const detail = err?.response?.data?.detail || err.message || 'Something went wrong.'

      if (status === 404) {
        setPanelError("Couldn't load this report's chat. The report may no longer exist.")
        return
      }

      // All other errors (500, network) → inline thread error with retry
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: status === 400
            ? `Request error: ${detail}`
            : `Error: ${detail}`,
          isError: true,
          failedMessage: clean,
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, messages, isLoading, reportId, getHistory])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleRetry = (failedMessage) => {
    // Remove the error bubble then resend
    setMessages(prev => prev.filter(m => m.failedMessage !== failedMessage))
    sendMessage(failedMessage)
  }

  const handleNewChat = () => {
    setMessages([])
    setInput('')
    setPanelError(null)
  }

  const charCount = input.length
  const charWarning = charCount > 3600
  const charOver = charCount > MAX_CHARS
  const canSend = !isLoading && charCount > 0 && !charOver

  return (
    <>
      {/* ----------------------------------------------------------------- */}
      {/* CHAT PANEL                                                         */}
      {/* ----------------------------------------------------------------- */}
      <div
        className={`fixed bottom-24 right-4 sm:right-6 z-50 flex flex-col transition-all duration-300 ease-out origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ width: 'min(400px, calc(100vw - 2rem))', height: '560px', maxHeight: 'calc(100vh - 8rem)' }}
      >
        {/* Panel container */}
        <div className="flex flex-col h-full glass-panel rounded-2xl border border-outline-variant/30 shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">smart_toy</span>
              <div>
                <h3 className="text-sm font-extrabold tracking-wide tech-mono text-on-surface">Chat with this PR</h3>
                <p className="text-[10px] text-on-surface-variant tech-mono">Powered by Gemini · ephemeral session</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleNewChat}
                  title="New chat"
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-high/50 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">add_comment</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-surface-high/50 text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>

          {/* Panel-level fatal error (404) */}
          {panelError ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="material-symbols-outlined text-error text-3xl">error</span>
              <p className="text-sm text-on-surface font-semibold">{panelError}</p>
              <button
                onClick={handleNewChat}
                className="text-xs text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <>
              {/* Message thread */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {messages.length === 0 && !isLoading ? (
                  <EmptyState onChipClick={(q) => { setInput(q); textareaRef.current?.focus() }} />
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <ChatBubble
                        key={idx}
                        role={msg.role}
                        content={msg.content}
                        isError={msg.isError}
                        onRetry={msg.isError ? () => handleRetry(msg.failedMessage) : undefined}
                      />
                    ))}
                    {isLoading && (
                      <div className="flex items-start gap-2 my-2">
                        <div className="w-6 h-6 shrink-0 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center mt-0.5">
                          <span className="material-symbols-outlined text-primary" style={{ fontSize: '13px' }}>smart_toy</span>
                        </div>
                        <div className="glass-card rounded-2xl rounded-tl-sm border border-outline-variant/25">
                          <TypingIndicator />
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="shrink-0 border-t border-outline-variant/20 p-3">
                <div className={`flex items-end gap-2 rounded-xl border transition-colors ${
                  charOver
                    ? 'border-error/50 bg-error/5'
                    : 'border-outline-variant/30 bg-surface-lowest/40 focus-within:border-primary/40'
                }`}>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    placeholder="Ask about this PR…"
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 px-3 py-2.5 outline-none leading-relaxed disabled:opacity-50"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!canSend}
                    className={`mb-1.5 mr-1.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                      canSend
                        ? 'bg-primary-container text-bg hover:opacity-85 cursor-pointer shadow-sm'
                        : 'bg-surface-high/30 text-on-surface-variant/40 cursor-not-allowed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                  </button>
                </div>

                {/* Character counter + hint */}
                <div className="flex items-center justify-between mt-1.5 px-1">
                  <span className="text-[10px] text-on-surface-variant/50 tech-mono">
                    Enter to send · Shift+Enter for newline
                  </span>
                  <span className={`text-[10px] tech-mono font-bold transition-colors ${
                    charOver ? 'text-error' : charWarning ? 'text-tertiary' : 'text-on-surface-variant/40'
                  }`}>
                    {charCount}/{MAX_CHARS}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* FLOATING ACTION BUTTON                                             */}
      {/* ----------------------------------------------------------------- */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer ${
          isOpen
            ? 'bg-surface-high border border-outline-variant/40 text-on-surface-variant rotate-0'
            : 'bg-primary-container text-bg hover:scale-110 hover:shadow-primary/20'
        }`}
        aria-label={isOpen ? 'Close chat' : 'Chat with this PR'}
        title={isOpen ? 'Close chat' : 'Chat with this PR'}
      >
        {isOpen
          ? <span className="material-symbols-outlined text-2xl">close</span>
          : <ChatSparkleIcon size={26} />
        }
        {/* Unread dot when panel is closed and messages exist */}
        {!isOpen && messages.length > 0 && (
          <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-error border-2 border-surface-dim animate-pulse" />
        )}
      </button>
    </>
  )
}
