import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'
import f1Steps from '@/data/f1-steps.json'

const client = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const profile = await req.json()

    // For now, always use the F-1 knowledge base.
    const steps = f1Steps

    const prompt = `
You are an immigration navigator helping an international student understand their next steps.

Student profile:
${JSON.stringify(profile, null, 2)}

Available steps:
${JSON.stringify(steps, null, 2)}

Return a JSON object with exactly this shape:
{
  "plan": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "requires": ["string"],
      "unlocks": ["string"],
      "deadline_days": null,
      "deadline_trigger": "",
      "official_link": "",
      "forms": ["string"],
      "common_mistakes": ["string"],
      "documents_needed": ["string"],
      "status": "done",
      "blocking_reason": ""
    }
  ]
}

Rules:
- Return ALL steps from the available steps list.
- Keep each step's original fields unchanged unless required below.
- Add a "status" field to each step:
  - "done": if the student's profile clearly indicates this is already complete
  - "available": if all required prerequisite steps are done and the student can do this now
  - "blocked": if one or more required prerequisite steps are not done
- Add "blocking_reason" only when status is "blocked". It should be a short plain-English explanation.
- If a field is missing in the source step, use null, "" or [] as appropriate.
- Return only valid JSON. No markdown. No commentary.

Completion rules:
- has_bank_account: true -> bank_account is done
- has_ssn: true -> ssn_on_campus is done
- has_itin: true -> itin is done
- has_address: true -> local_address is done
- employment_status "opt" -> opt_application is done
- employment_status "stem_opt" -> stem_opt is done
- employment_status "cpt" -> cpt_authorization is done
- arrive_us and university_checkin are done if the student has completed intake and is already in the US
`

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You return only valid JSON objects that can be parsed with JSON.parse.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const text = response.choices[0]?.message?.content || '{}'

    try {
      const parsed = JSON.parse(text)
      return NextResponse.json({ plan: Array.isArray(parsed.plan) ? parsed.plan : [] })
    } catch (parseError) {
      console.error('Raw model output:', text)
      console.error('Generate plan parse error:', parseError)
      return NextResponse.json(
        { error: 'Model returned invalid JSON.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Generate plan error:', error)
    return NextResponse.json(
      { error: 'Failed to generate plan. Check your GROQ_API_KEY.' },
      { status: 500 }
    )
  }
}
