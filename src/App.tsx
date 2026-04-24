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

const BACKEND_BASE_URL = 'YOUR_BACKEND_URL_HERE'

function App() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Welcome to MediCare OS Command Center. I'm Erin—your AI System Administrator. How can I help right now?",
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

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
  }, [chatHistory.length, isLoading])

  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return

    el.style.height = 'auto'
    const maxPx = 144
    el.style.height = `${Math.min(el.scrollHeight, maxPx)}px`
  }, [input])

  async function sendMessage() {
    const message = input.trim()
    if (!message || isLoading) return

    setInput('')
    setIsLoading(true)

    setChatHistory((prev) => {
      const nextHistory: ChatMessage[] = [
        ...prev,
        { role: 'user', content: message },
      ]

      void (async () => {
        try {
          const res = await fetch(`${BACKEND_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message,
              history: nextHistory,
            }),
          })

          if (!res.ok) {
            const text = await res.text()
            throw new Error(
              `Request failed (${res.status}): ${text || res.statusText}`,
            )
          }

          const data = (await res.json()) as { reply?: string }
          const reply = (data.reply ?? '').toString().trim()

          setChatHistory((prev2) => [
            ...prev2,
            {
              role: 'assistant',
              content:
                reply ||
                "I didn't receive a reply payload. Please check your backend response shape: {\"reply\":\"...\"}.",
            },
          ])
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Unknown error'
          setChatHistory((prev2) => [
            ...prev2,
            {
              role: 'assistant',
              content: `I hit an error contacting the command center backend: ${msg}`,
            },
          ])
        } finally {
          setIsLoading(false)
        }
      })()

      return nextHistory
    })
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
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-teal-500/15 ring-1 ring-teal-400/20">
                    <div className="size-2.5 rounded-full bg-teal-400" />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold tracking-wide text-slate-50">
                      MediCare OS
                    </div>
                    <div className="text-xs text-slate-400">Command Center</div>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="inline-flex size-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/60"
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

          {!isSidebarCollapsed && (
            <div className="mt-auto border-t border-slate-800 px-6 py-4">
              <div className="text-xs text-slate-400">System</div>
              <div className="mt-1 text-sm font-medium text-slate-100">
                Hospital Ops • v1.0
              </div>
            </div>
          )}
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

          <div className="flex min-h-0 flex-1 flex-col">
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
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
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white">
              <div className="mx-auto w-full max-w-4xl px-4 py-4 md:px-8">
                <div className="pb-2 text-xs text-slate-500">
                  {isLoading ? (
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
                    void sendMessage()
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
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            void sendMessage()
                          }
                        }}
                        rows={1}
                        placeholder="Message Erin…"
                        className="max-h-36 w-full resize-none overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-28 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-400/15 disabled:bg-slate-50"
                        disabled={isLoading}
                      />
                      <div className="pointer-events-none absolute bottom-3 right-4 hidden text-[11px] text-slate-400 sm:block">
                        Enter • Shift+Enter
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isLoading || !input.trim()}
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
