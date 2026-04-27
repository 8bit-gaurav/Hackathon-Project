import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarClock,
  LayoutDashboard,
  Send,
  Settings,
  UserRound,
} from 'lucide-react'

type ChatRole = 'user' | 'assistant'

type ChatMessage = {
  role: ChatRole
  content: string
}

function App() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Welcome to MediCare OS. I am Erin, your AI System Administrator. How can I assist you today?',
    },
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  // Notice I added setIsApiOnline here!
  const [isApiOnline, setIsApiOnline] = useState(false) 
  
  const typingTimeoutRef = useRef<number | null>(null)

  const navItems = useMemo(
    () => [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Patients', icon: UserRound },
      { label: 'Appointments', icon: CalendarClock },
      { label: 'Settings', icon: Settings },
    ],
    [],
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [chatHistory.length, isTyping])

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

  // --- THE NEW REAL API BRIDGE ---
  async function handleSend() {
    const message = inputValue.trim()
    if (!message || isTyping) return

    setChatHistory((prev) => [...prev, { role: 'user', content: message }])
    setInputValue('')
    setIsTyping(true)

    try {
      // 1. Send the message to your local Python server
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message }), 
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      
      // 2. Turn the sidebar status dot GREEN because we connected!
      setIsApiOnline(true); 

      // 3. Add Erin's real AI response to the chat history
      setChatHistory((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      
    } catch (error) {
      console.error("Failed to fetch API:", error);
      // Turn the status dot RED if it fails
      setIsApiOnline(false); 
      setChatHistory((prev) => [...prev, { role: 'assistant', content: "⚠️ Connection to hospital server failed. Please check if the Python backend is running." }]);
    } finally {
      setIsTyping(false); 
    }
  }

  return (
    <div className="h-full bg-gray-50 text-slate-900">
      <div className="flex h-full">
        <aside
          className={[
            'hidden shrink-0 bg-slate-900 text-slate-100 md:flex md:flex-col',
            'transition-[width] duration-300 ease-in-out',
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
              {!isSidebarCollapsed ? (
                <div className="flex min-h-10 items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-teal-500/15 ring-1 ring-teal-400/20">
                    <div className="size-2.5 rounded-full bg-teal-400" />
                  </div>
                  <div className="text-sm font-semibold leading-none tracking-wide text-slate-50">
                    MediCare OS
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="inline-flex size-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
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

          <nav className={isSidebarCollapsed ? 'px-2 py-4' : 'px-3 py-4'}>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    type="button"
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={[
                      'flex w-full items-center rounded-xl py-2.5 text-left text-sm text-slate-200 transition',
                      'hover:bg-slate-800/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60',
                      isSidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3',
                    ].join(' ')}
                  >
                    <Icon className="size-5 text-slate-300" />
                    {!isSidebarCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </nav>

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
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-slate-900">
                  Erin - AI System Administrator
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                  <span className="relative inline-flex size-2">
                    <span className="absolute inline-flex size-2 animate-ping rounded-full bg-emerald-500 opacity-30" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-emerald-700">Online</span>
                </div>
              </div>
              <div className="hidden text-sm text-slate-500 md:block">
                Secure clinical operations assistant
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
                {chatHistory.map((m, idx) => {
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