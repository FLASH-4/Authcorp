import { NextRequest, NextResponse } from 'next/server'

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.set('authcorp_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return response
}