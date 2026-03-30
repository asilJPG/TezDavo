'use client'
import { useState, useRef, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'

interface Message { role: 'user' | 'assistant'; content: string }

const QUICK = [
  'Как принимать Парацетамол?',
  'Побочные эффекты Ибупрофена',
  'Можно ли сочетать витамин C и антибиотики?',
  'Что такое ингибиторы протонной помпы?',
]

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Здравствуйте! Я AI медицинский помощник TezDavo.\n\nЯ помогу ответить на вопросы о лекарствах: как принимать, действие, побочные эффекты и взаимодействие препаратов.\n\n⚕️ AI помощник не заменяет консультацию врача.',
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: updated.slice(-10) }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.message || 'Произошла ошибка. Попробуйте снова.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ошибка соединения. Проверьте интернет.' }])
    } finally { setLoading(false) }
  }

  return (
    <AppLayout>
      {/* Занимаем всю высоту контент-зоны */}
      <div className="flex flex-col" style={{ height: 'calc(100vh - 0px)' }}>

        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-lg flex-shrink-0">🤖</div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">AI Медицинский помощник</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"/>
              <span className="text-xs text-gray-400">Онлайн 24/7</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex-shrink-0">
          <p className="text-xs text-amber-700">⚕️ Информация носит ознакомительный характер и не заменяет консультацию врача.</p>
        </div>

        {/* Messages — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0">🤖</div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0">🤖</div>
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    {[0,150,300].map(d => <div key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}/>)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>
        </div>

        {/* Quick questions */}
        {messages.length === 1 && (
          <div className="px-4 pb-3 flex-shrink-0 bg-gray-50">
            <div className="max-w-2xl mx-auto">
              <p className="text-xs text-gray-400 mb-2">Популярные вопросы:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK.map(q => (
                  <button key={q} onClick={() => send(q)}
                    className="text-xs bg-white text-blue-700 border border-blue-200 rounded-full px-3 py-1.5 hover:bg-blue-50 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t px-4 py-3 flex-shrink-0">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex gap-2">
              <input
                value={input} onChange={e => setInput(e.target.value)}
                placeholder="Спросите о лекарстве..."
                disabled={loading}
                className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <button type="submit" disabled={loading || !input.trim()}
                className="bg-blue-600 disabled:opacity-40 text-white rounded-xl w-12 flex items-center justify-center text-lg hover:bg-blue-700 transition-colors">
                ↑
              </button>
            </form>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
