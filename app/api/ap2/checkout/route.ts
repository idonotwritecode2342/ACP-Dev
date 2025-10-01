import { NextRequest, NextResponse } from 'next/server'

import type { AP2CheckoutRequest } from '@/lib/ap2'
import { handleAP2Checkout } from '@/lib/payments'

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as AP2CheckoutRequest
  try {
    const response = await handleAP2Checkout(payload)
    return NextResponse.json(response)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
