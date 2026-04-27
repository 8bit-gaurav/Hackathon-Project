import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  HeartPulse,
  Menu,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  role: ChatRole
  content: string
}

type ChatSession = {
  id: string
  title: string
  messages: ChatMessage[]
}

const SESSIONS_STORAGE_KEY = 'chatSessions'
const ACTIVE_SESSION_ID_STORAGE_KEY = 'activeSessionId'
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function loadStoredSessions(): ChatSession[] {
  const raw = window.localStorage.getItem(SESSIONS_STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((session): session is ChatSession => {
      return (
        typeof session?.id === 'string' &&
        typeof session?.title === 'string' &&
        Array.isArray(session?.messages)
      )
    })
  } catch (error) {
    console.error('Failed to parse stored sessions:', error)
    return []
  }
}

function loadStoredActiveSessionId(): string {
  return window.localStorage.getItem(ACTIVE_SESSION_ID_STORAGE_KEY) ?? ''
}

function makeSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function makeSessionTitle(message: string) {
  const words = message.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return 'New Chat'
  const maxWords = 5
  const title = words.slice(0, maxWords).join(' ')
  return words.length > maxWords ? `${title}...` : title
}

function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadStoredSessions())
  const [activeSessionId, setActiveSessionId] = useState<string>(() =>
    loadStoredActiveSessionId(),
  )
  const [isTyping, setIsTyping] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isApiOnline, setIsApiOnline] = useState(false)
  const typingTimeoutRef = useRef<number | null>(null)

  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? sessions[0]
  const activeMessages = activeSession?.messages ?? []

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [activeMessages.length, isTyping, activeSessionId])

  useEffect(() => {
    window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
    window.localStorage.setItem(ACTIVE_SESSION_ID_STORAGE_KEY, activeSessionId)
  }, [sessions, activeSessionId])

  useEffect(() => {
    if (sessions.length === 0) return
    if (!activeSessionId || !sessions.some((session) => session.id === activeSessionId)) {
      setActiveSessionId(sessions[0].id)
    }
  }, [sessions, activeSessionId])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return

    el.style.height = 'auto'
    const maxPx = 144
    el.style.height = `${Math.min(el.scrollHeight, maxPx)}px`
  }, [inputValue])

  function updateSessionMessages(
    sessionId: string,
    updater: (messages: ChatMessage[]) => ChatMessage[],
  ) {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session
        const nextMessages = updater(session.messages)
        const firstUserMessage = nextMessages.find((m) => m.role === 'user')
        return {
          ...session,
          messages: nextMessages,
          title: firstUserMessage
            ? makeSessionTitle(firstUserMessage.content)
            : 'New Chat',
        }
      }),
    )
  }

  function handleNewChat() {
    const newSession: ChatSession = {
      id: makeSessionId(),
      title: 'New Chat',
      messages: [],
    }
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    setIsTyping(false)
    setInputValue('')
    const nextSessions = [newSession, ...sessions]
    setSessions(nextSessions)
    setActiveSessionId(newSession.id)
    window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(nextSessions))
    window.localStorage.setItem(ACTIVE_SESSION_ID_STORAGE_KEY, newSession.id)
  }

  function handleDeleteSession(
    e: React.MouseEvent<HTMLButtonElement>,
    sessionId: string,
  ) {
    e.stopPropagation()
    setSessions((prev) => prev.filter((session) => session.id !== sessionId))
    if (activeSessionId === sessionId) {
      setActiveSessionId('')
    }
  }

  async function handleSend() {
    const message = inputValue.trim()
    if (!message || isTyping) return

    let sessionId = activeSession?.id
    if (!sessionId) {
      const newSession: ChatSession = {
        id: makeSessionId(),
        title: makeSessionTitle(message),
        messages: [],
      }
      sessionId = newSession.id
      setSessions((prev) => [newSession, ...prev])
      setActiveSessionId(sessionId)
    }

    updateSessionMessages(sessionId, (messages) => [
      ...messages,
      { role: 'user', content: message },
    ])
    setInputValue('')
    setIsTyping(true)

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = (await response.json()) as { reply?: string }
      setIsApiOnline(true)

      updateSessionMessages(sessionId, (messages) => [
        ...messages,
        {
          role: 'assistant',
          content: data.reply ?? 'No response received from backend.',
        },
      ])
    } catch (error) {
      console.error('Failed to fetch API:', error)
      setIsApiOnline(false)
      updateSessionMessages(sessionId, (messages) => [
        ...messages,
        {
          role: 'assistant',
          content:
            '⚠️ Connection to hospital server failed. Please check if the Python backend is running.',
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="h-full bg-gray-50 text-slate-900">
      <div className="flex h-full">
        {isMobileMenuOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside
          className={[
            'fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col bg-slate-900 text-slate-100',
            'transform transition-transform duration-300 md:relative md:translate-x-0',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
            'transition-[width] ease-in-out',
            isSidebarCollapsed ? 'w-20' : 'w-72',
          ].join(' ')}
        >
          <div
            className={[
              'border-b border-slate-800 py-5',
              isSidebarCollapsed ? 'px-3' : 'px-6',
            ].join(' ')}
          >
            <div
              className={[
                'flex items-center',
                isSidebarCollapsed ? 'justify-center' : 'justify-between',
              ].join(' ')}
            >
              <button
                type="button"
                aria-label="Close mobile menu"
                className="inline-flex size-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="size-5" />
              </button>

              {!isSidebarCollapsed ? (
                <div className="flex min-h-10 items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/20 ring-1 ring-emerald-400/25">
                    <HeartPulse className="size-5 text-emerald-400" />
                  </div>
                  <div className="text-sm font-semibold leading-none tracking-wide text-slate-50">
                    Erin OS
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="hidden size-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 md:inline-flex"
                onClick={() => setIsSidebarCollapsed((v) => !v)}
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="size-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          <section className={isSidebarCollapsed ? 'px-2 py-4' : 'px-3 py-4'}>
            <button
              type="button"
              title={isSidebarCollapsed ? 'New Chat' : undefined}
              onClick={handleNewChat}
              className={[
                'mb-4 inline-flex w-full items-center rounded-xl bg-teal-600 py-2.5 text-sm font-medium text-white transition',
                'hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70',
                isSidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
              ].join(' ')}
            >
              <Plus className="size-4 shrink-0" />
              {!isSidebarCollapsed && <span>New Chat</span>}
            </button>

            {!isSidebarCollapsed && (
              <div className="px-3 pb-2 text-xs font-medium text-slate-500">
                Recent Sessions
              </div>
            )}

            <div className="space-y-1">
              {sessions.map((session) => (
                <div key={session.id} className="group relative">
                  <button
                    type="button"
                    title={isSidebarCollapsed ? session.title : undefined}
                    onClick={() => setActiveSessionId(session.id)}
                    className={[
                      'flex w-full items-center rounded-xl py-2.5 text-left text-sm text-slate-300 transition',
                      'hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60',
                      activeSessionId === session.id ? 'bg-slate-800/80 text-white' : '',
                      isSidebarCollapsed
                        ? 'justify-center px-2'
                        : 'gap-2.5 px-3 pr-10',
                    ].join(' ')}
                  >
                    <MessageSquare className="size-4 shrink-0 text-slate-400" />
                    {!isSidebarCollapsed && (
                      <span className="truncate text-sm">{session.title}</span>
                    )}
                  </button>

                  {!isSidebarCollapsed && (
                    <button
                      type="button"
                      aria-label={`Delete ${session.title}`}
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 md:text-inherit opacity-100 md:opacity-0 transition hover:bg-slate-700 hover:text-red-300 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 md:group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className={isSidebarCollapsed ? 'mt-auto px-2 pb-4' : 'mt-auto px-3 pb-4'}>
            <div
              className={[
                'rounded-xl border border-slate-800 bg-slate-900/40',
                isSidebarCollapsed ? 'px-3 py-3' : 'px-3 py-2.5',
              ].join(' ')}
              title={isSidebarCollapsed ? (isApiOnline ? 'API Status: Online' : 'API Status: Disconnected') : undefined}
            >
              <div className={isSidebarCollapsed ? 'flex items-center justify-center' : 'flex items-center gap-2'}>
                <div
                  className={[
                    'size-2 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]',
                    isApiOnline
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]'
                      : 'bg-red-500 animate-pulse',
                  ].join(' ')}
                />
                {!isSidebarCollapsed && (
                  <span className="text-xs text-slate-500">
                    API Status: {isApiOnline ? 'Online' : 'Disconnected'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 md:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  aria-label="Open sidebar menu"
                  className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60 md:hidden"
                  onClick={() => setIsMobileMenuOpen(true)}
                >
                  <Menu className="size-5" />
                </button>
                <div className="truncate text-base font-semibold text-slate-900">
                  Erin - AI Healthcare Assistant
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <span className="relative inline-flex size-2">
                    <span className="absolute inline-flex size-2 animate-ping rounded-full bg-emerald-500 opacity-30" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-emerald-700">Online</span>
                </div>
              </div>
            </div>
          </header>

          <div
            className={[
              'flex min-h-0 flex-1 flex-col',
              'bg-slate-50',
              'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)]',
              '[background-size:24px_24px]',
              '[background-position:0_0]',
            ].join(' ')}
          >
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto bg-transparent px-4 py-6 md:px-8"
            >
              <div className="mx-auto w-full max-w-4xl space-y-4">
                {activeMessages.length === 0 && (
                  <div className="rounded-2xl bg-white/80 px-5 py-4 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200/70">
                    Start a new session by sending your first message.
                  </div>
                )}

                {activeMessages.map((m, idx) => {
                  const isUser = m.role === 'user'
                  return (
                    <div
                      key={`${idx}-${m.role}`}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={[
                          'max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed md:max-w-[70%] md:text-[15px]',
                          isUser
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/70',
                        ].join(' ')}
                      >
                        {m.content}
                      </div>
                    </div>
                  )
                })}

                {isTyping ? (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl bg-white px-5 py-4 text-sm leading-relaxed text-slate-800 shadow-sm ring-1 ring-slate-200/70 md:max-w-[70%] md:text-[15px]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-block size-2 rounded-full bg-slate-300 animate-pulse [animation-delay:-200ms]" />
                        <span className="inline-block size-2 rounded-full bg-slate-300 animate-pulse [animation-delay:-100ms]" />
                        <span className="inline-block size-2 rounded-full bg-slate-300 animate-pulse" />
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="bg-transparent">
              <div className="mx-auto w-full max-w-4xl px-4 py-4 md:px-8">
                <div className="pb-2 text-xs text-slate-500">
                  {isTyping ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex">
                        <span className="mr-1 inline-block size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-200ms]" />
                        <span className="mr-1 inline-block size-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-100ms]" />
                        <span className="inline-block size-1.5 animate-bounce rounded-full bg-slate-400" />
                      </span>
                      <span>Typing...</span>
                    </span>
                  ) : (
                    <span className="opacity-0">Typing...</span>
                  )}
                </div>

                <form
                  className="flex items-end gap-3"
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                >
                  <div className="flex-1">
                    <label className="sr-only" htmlFor="chat-input">
                      Message
                    </label>
                    <div className="relative">
                      <textarea
                        ref={inputRef}
                        id="chat-input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSend()
                          }
                        }}
                        rows={1}
                        placeholder="Message Erin…"
                        className="max-h-36 w-full resize-none overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-28 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/15 disabled:bg-slate-50"
                        disabled={isTyping}
                      />
                      <div className="pointer-events-none absolute bottom-3 right-4 hidden text-[11px] text-slate-400 sm:block">
                        Enter • Shift+Enter
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isTyping || !inputValue.trim()}
                  >
                    <span className="hidden sm:inline">Send</span>
                    <Send className="size-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App