import { NextRequest, NextResponse } from 'next/server'

import type { ACPCheckoutRequest } from '@/lib/acp'
import { handleACPCheckout } from '@/lib/payments'

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as ACPCheckoutRequest
  try {
    const response = await handleACPCheckout(payload)
    return NextResponse.json(response)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
