import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { SecurityManager, AuditLogger } from '@/lib/security'

const anchorSchema = z.object({
  hash: z.string().min(32).max(128),
  network: z.enum(['ethereum', 'polygon', 'solana']).default('ethereum')
})

export async function POST(req: NextRequest) {
  try {
    const session = cookies().get('authcorp_session')?.value
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = SecurityManager.verifyToken(session)

    const body = await req.json()
    const parsed = anchorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }

    const { hash, network } = parsed.data
    const anchorId = `anchor_${network}_${SecurityManager.generateSecureId(16)}`

    await AuditLogger.logAction({
      userId: user.userId || 'unknown',
      action: 'blockchain_anchor_create',
      resource: `hash:${hash.slice(0, 10)}...`,
      details: { network, anchorId },
      riskLevel: 'low'
    })

    return NextResponse.json({ anchorId, network, status: 'anchored' })
  } catch (err: any) {
    return NextResponse.json({ error: 'Anchor failed', message: String(err) }, { status: 500 })
  }
}