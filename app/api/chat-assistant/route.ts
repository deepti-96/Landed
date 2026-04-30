import Groq from 'groq-sdk'
import type { ChatCompletionMessageParam } from 'groq-sdk/resources/chat/completions'
import { NextRequest, NextResponse } from 'next/server'
import { enforceRateLimit, requireAuthenticatedUser } from '@/lib/api-auth'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const rateLimitResult = enforceRateLimit(`chat-assistant:${authResult.user.id}`)
    if (rateLimitResult) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        {
          status: rateLimitResult.status,
          headers: { 'Retry-After': String(rateLimitResult.retryAfterSeconds) },
        }
      )
    }

    const { message, messages = [], profile, plan } = await req.json()

    const compactPlan = Array.isArray(plan)
      ? plan.map((step: any) => ({
          id: step.id,
          title: step.title,
          status: step.status,
          blocking_reason: step.blocking_reason || '',
        }))
      : []

    const conversation: ChatCompletionMessageParam[] = Array.isArray(messages)
      ? messages.slice(-8).map((entry: any) => ({
          role: (entry.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: String(entry.content || ''),
        }))
      : []

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 350,
      messages: [
        {
          role: 'system',
          content:
            'You are Aster, a warm and practical roadmap assistant inside a student immigration app called Landed. Help the user understand their current roadmap, deadlines, forms, and next steps using the provided profile and plan. Be concise, encouraging, and specific. Do not invent legal facts beyond the supplied context. If you are unsure, recommend checking the official link or the international student office. Keep replies under 140 words when possible.',
        },
        {
          role: 'system',
          content: `Student profile: ${JSON.stringify(profile)}`,
        },
        {
          role: 'system',
          content: `Current roadmap steps: ${JSON.stringify(compactPlan)}`,
        },
        ...conversation,
        {
          role: 'user',
          content: String(message || ''),
        },
      ],
    })

    const reply = completion.choices[0]?.message?.content?.trim() || 'I am here to help you with your roadmap.'
    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat assistant error:', error)
    return NextResponse.json({ error: 'Failed to answer chat message.' }, { status: 500 })
  }
}
