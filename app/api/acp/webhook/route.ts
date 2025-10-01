import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { prisma } from '@/lib/db'
import { getStripeClient } from '@/lib/stripe'

type AgentCommerceOrder = {
  id: string
  status: 'authorized' | 'requires_action' | 'failed'
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = headers().get('stripe-signature')
  const webhookSecret = process.env.ACP_SIGNING_KEY

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: 'Missing webhook configuration' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripeClient().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Stripe webhook validation failed', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'agent_commerce.order.updated') {
    const order = event.data.object as AgentCommerceOrder
    await prisma.order.updateMany({
      where: { externalId: order.id },
      data: { status: order.status === 'authorized' ? 'AUTHORIZED' : 'FAILED' },
    })
  }

  return NextResponse.json({ received: true })
}
