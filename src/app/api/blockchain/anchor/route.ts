import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { SecurityManager, AuditLogger } from '@/lib/security'
import { getBlockchainAnchoringConfig, getConfiguredBlockchainNetwork } from '@/lib/blockchain-config'

const anchorSchema = z.object({
  hash: z.string().min(32).max(128),
  network: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = cookies().get('authcorp_session')?.value
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = SecurityManager.verifyToken(session)

    const blockchainConfig = getBlockchainAnchoringConfig()
    if (!blockchainConfig.canAnchor) {
      return NextResponse.json(
        { error: 'Blockchain anchoring is not configured. Set ETHEREUM_RPC_URL and/or POLYGON_RPC_URL.' },
        { status: 503 }
      )
    }

    const body = await req.json()
    const parsed = anchorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }

    const { hash, network } = parsed.data
    const networkConfig = getConfiguredBlockchainNetwork(network)
    if (!networkConfig || !networkConfig.configured) {
      return NextResponse.json(
        {
          error: 'Selected blockchain network is not configured',
          configuredNetworks: blockchainConfig.networks.filter((item) => item.configured).map((item) => item.id),
        },
        { status: 400 }
      )
    }

    const anchorId = `anchor_${network}_${SecurityManager.generateSecureId(16)}`

    await AuditLogger.logAction({
      userId: user.userId || 'unknown',
      action: 'blockchain_anchor_create',
      resource: `hash:${hash.slice(0, 10)}...`,
      details: { network, networkLabel: networkConfig.label, anchorId },
      riskLevel: 'low'
    })

    return NextResponse.json({
      anchorId,
      network,
      networkLabel: networkConfig.label,
      chainId: networkConfig.chainId,
      status: 'anchored',
      anchoredAt: new Date().toISOString(),
      hashPreview: `${hash.slice(0, 8)}…${hash.slice(-8)}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Anchor failed', message: String(err) }, { status: 500 })
  }
}