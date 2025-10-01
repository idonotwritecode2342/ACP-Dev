import { NextRequest, NextResponse } from 'next/server'

import { handleACPCheckout, handleAP2Checkout } from '@/lib/payments'
import type { ACPCheckoutRequest } from '@/lib/acp'
import type { AP2CheckoutRequest } from '@/lib/ap2'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { protocol } = body as { protocol: 'ACP' | 'AP2' }

  if (protocol === 'ACP') {
    const response = await handleACPCheckout(body as ACPCheckoutRequest)
    return NextResponse.json(response)
  }

  if (protocol === 'AP2') {
    const response = await handleAP2Checkout(body as AP2CheckoutRequest)
    return NextResponse.json(response)
  }

  return NextResponse.json({ error: 'Unsupported protocol' }, { status: 400 })
}
