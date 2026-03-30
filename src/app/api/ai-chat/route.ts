// src/app/api/ai-chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `Ты — AI медицинский помощник платформы PharmaUZ (аптечный маркетплейс в Узбекистане).

Ты помогаешь пользователям с вопросами о:
- Как принимать лекарства (дозировка, время, с едой или без)
- Действие и назначение лекарств
- Побочные эффекты
- Взаимодействие между лекарствами
- Общие медицинские рекомендации

Правила:
1. Всегда отвечай на русском языке
2. Будь конкретным и понятным
3. Если вопрос о болезни или симптомах — дай общие рекомендации и ОБЯЗАТЕЛЬНО предложи обратиться к врачу
4. Никогда не ставь диагнозы
5. При вопросах об антибиотиках — всегда упоминай, что их нельзя принимать без назначения врача
6. Если вопрос не связан с медициной или лекарствами — вежливо перенаправь к медицинским темам

ВАЖНО: В конце каждого ответа добавляй дисклеймер:
"⚕️ AI помощник не заменяет консультацию врача."

Формат ответов: структурированный, с пунктами когда нужно, не слишком длинный.`

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { message, history = [] } = await req.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Сообщение не может быть пустым' }, { status: 400 })
    }

    // Build messages array for Anthropic
    const messages = [
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    })

    const assistantMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Извините, не удалось получить ответ.'

    // Save to history if user is logged in
    if (user) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      if (dbUser) {
        await supabase.from('ai_chat_history').insert([
          { user_id: dbUser.id, role: 'user', content: message },
          { user_id: dbUser.id, role: 'assistant', content: assistantMessage },
        ])
      }
    }

    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: 'Ошибка AI помощника. Попробуйте позже.' },
      { status: 500 }
    )
  }
}
