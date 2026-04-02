import { NextRequest, NextResponse } from 'next/server'
import { SecurityManager, AuditLogger } from '@/lib/security'
import { googleTokenSchema, validate } from '@/lib/validation'

// Google OAuth endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = validate(googleTokenSchema, body)
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.errors },
        { status: 400 }
      )
    }
    const { token } = validated.data

    // Verify Google token
    const googleResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`
    )

    if (!googleResponse.ok) {
      await AuditLogger.logAction({
        userId: 'anonymous',
        action: 'google_login_failed',
        resource: 'auth',
        details: { reason: 'invalid_google_token' },
        ipAddress: clientIp,
        userAgent,
        riskLevel: 'medium'
      })

      return NextResponse.json(
        { error: 'Invalid Google token' },
        { status: 401 }
      )
    }

    const googleUser = await googleResponse.json()

    // Check if user exists or create new user
    const user = {
      id: `google_${googleUser.id}`,
      email: googleUser.email,
      name: googleUser.name,
      role: 'analyst' as const,
      permissions: ['document:analyze', 'report:view'],
      organization: 'Google SSO',
      avatar: googleUser.picture
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      organization: user.organization,
      loginMethod: 'google'
    }

    const jwtToken = SecurityManager.generateToken(tokenPayload, '24h')

    // Log successful Google login
    await AuditLogger.logAction({
      userId: user.id,
      action: 'google_login_successful',
      resource: 'auth',
      details: { 
        email: user.email, 
        name: user.name,
        loginMethod: 'google'
      },
      ipAddress: clientIp,
      userAgent,
      riskLevel: 'low'
    })

    const response = NextResponse.json({ success: true, user })
    response.cookies.set('authcorp_session', jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24,
    })
    return response

  } catch (error) {
    console.error('Google login error:', error)
    
    await AuditLogger.logAction({
      userId: 'system',
      action: 'google_login_error',
      resource: 'auth',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      riskLevel: 'high'
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}