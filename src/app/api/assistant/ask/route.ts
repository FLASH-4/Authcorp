import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { SecurityManager, AuditLogger } from '@/lib/security'
import { generateAssistantResponse, type AssistantContextSnapshot } from '@/lib/assistant-engine'
import { getAssistantRuntimeStatus } from '@/lib/assistant-runtime'

const askSchema = z.object({
  prompt: z.string().min(1).max(2000),
  context: z.any().optional()
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
    const assistantContext = (context || {}) as AssistantContextSnapshot
    const runtimeStatus = getAssistantRuntimeStatus()
    const assistantResponse = generateAssistantResponse(prompt, assistantContext)

    await AuditLogger.logAction({
      userId: user.userId || 'unknown',
      action: 'assistant_query',
      resource: 'assistant',
      details: {
        promptLength: prompt.length,
        topic: assistantResponse.topic,
        providerMode: runtimeStatus.mode,
        hasDocumentContext: Boolean(assistantContext.document),
      },
      riskLevel: 'low'
    })

    return NextResponse.json({
      reply: assistantResponse.reply,
      topic: assistantResponse.topic,
      confidence: assistantResponse.confidence,
      followUps: assistantResponse.followUps,
      summary: assistantResponse.summary,
      providerMode: runtimeStatus.mode,
      providerLabel: runtimeStatus.providerLabel,
      providerReady: runtimeStatus.ready,
      providerMessage: runtimeStatus.message,
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Assistant error', message: String(err) }, { status: 500 })
  }
}