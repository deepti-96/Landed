import Groq from 'groq-sdk'
import { NextRequest } from 'next/server'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { step, profile } = await req.json()

    const prompt = `
You are a friendly, clear immigration navigator helping an international student.

The student is asking about this step: ${JSON.stringify(step)}
Their profile: ${JSON.stringify(profile)}

Write a helpful explanation in plain English. No legal jargon. No scary language.

Format your response exactly like this:

**What this is**
[2 sentences explaining what this step is and why it matters]

**How to do it**
[Numbered steps, very specific and actionable]

**Documents you need**
[Bullet list]

**Common mistakes to avoid**
[Bullet list of the most important pitfalls]

**Need more help?**
Contact your international student office or visit: ${step.official_link || 'your university international office'}

Keep it under 300 words. Be warm and encouraging — moving to a new country is hard.
`

    const stream = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 600,
      temperature: 0.3,
      stream: true,
      messages: [{ role: 'user', content: prompt }]
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) controller.enqueue(encoder.encode(text))
        }
        controller.close()
      }
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })

  } catch (error) {
    console.error('Explain step error:', error)
    return new Response('Failed to explain step', { status: 500 })
  }
}
