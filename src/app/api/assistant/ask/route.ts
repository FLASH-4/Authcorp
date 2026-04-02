import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { SecurityManager, AuditLogger } from '@/lib/security'

const askSchema = z.object({
  prompt: z.string().min(1).max(2000),
  context: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const session = cookies().get('authcorp_session')?.value
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = SecurityManager.verifyToken(session)

    const body = await req.json()
    const parsed = askSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }

    const { prompt, context } = parsed.data

    // Minimal assistant stub response
    const reply = `I understand your request: "${prompt}". This is a stubbed response. Context: ${context || 'none'}.`

    await AuditLogger.logAction({
      userId: user.userId || 'unknown',
      action: 'assistant_query',
      resource: 'assistant',
      details: { promptLength: prompt.length },
      riskLevel: 'low'
    })

    return NextResponse.json({ reply })
  } catch (err: any) {
    return NextResponse.json({ error: 'Assistant error', message: String(err) }, { status: 500 })
  }
}