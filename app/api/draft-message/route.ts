import Groq from 'groq-sdk'
import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { enforceRateLimit, requireAuthenticatedUser } from '@/lib/api-auth'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

const TEMPLATES: Record<string, (step: any, profile: any) => string> = {
  dso_email: (step, profile) => `
Draft a polite, professional email from an international student to their DSO (Designated School Official).

Purpose: The student needs help with "${step.title}"
Student visa type: ${profile.visa_type}
Student profile: ${JSON.stringify(profile)}

Requirements:
- Professional but warm tone
- Under 150 words
- Use [YOUR FULL NAME] and [YOUR STUDENT ID] as placeholders
- Include a specific question or request related to the step
- End with a thank you

Output only the email text, no explanation.
`,
  landlord_email: (step, profile) => `
Draft a professional email from an international student to a potential landlord.

Context: The student has an I-20 and visa but no US credit history yet.
Student visa type: ${profile.visa_type}

Requirements:
- Professional and reassuring tone
- Mention they are a student at [UNIVERSITY NAME]
- Offer to pay extra deposit to compensate for no credit history
- Under 200 words
- Use [YOUR FULL NAME] as placeholder

Output only the email text, no explanation.
`,
  bank_inquiry: (step, profile) => `
Draft a brief, professional email to a bank asking about opening an account as an international student.

Context: Student has an ITIN (not SSN yet) and wants to open a checking account.
Student visa type: ${profile.visa_type}

Requirements:
- Professional tone
- Ask specifically about ITIN acceptance (not SSN)
- Ask what documents to bring
- Under 120 words
- Use [YOUR FULL NAME] as placeholder

Output only the email text, no explanation.
`,
  ssa_appointment: (step, profile) => `
Draft a short script for what an international student should say when calling the Social Security Administration to schedule an appointment.

Context: Student needs an SSN for ${step?.title || 'employment'}
Student visa type: ${profile.visa_type}

Requirements:
- Clear and concise
- Mention they are an F-1 student with a job offer
- List the documents they should mention they have
- Under 100 words

Output only the script text, no explanation.
`
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const rateLimitResult = enforceRateLimit(`draft-message:${authResult.user.id}`)
    if (rateLimitResult) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        {
          status: rateLimitResult.status,
          headers: { 'Retry-After': String(rateLimitResult.retryAfterSeconds) },
        }
      )
    }

    const { type, profile, step } = await req.json()

    const templateFn = TEMPLATES[type] || TEMPLATES.dso_email
    const prompt = templateFn(step, profile)

    const stream = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 400,
      temperature: 0.4,
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
    console.error('Draft message error:', error)
    return new Response('Failed to generate draft', { status: 500 })
  }
}
