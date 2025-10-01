import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db'

type AP2Notification = {
  id: string
  status: 'pending' | 'confirmed' | 'failed'
  orderRef: string
}

export async function POST(request: Request) {
  const signature = headers().get('ap2-signature')
  const partnerKey = process.env.AP2_PARTNER_KEY

  if (!signature || !partnerKey || signature !== partnerKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = (await request.json()) as AP2Notification

  await prisma.order.updateMany({
    where: { externalId: payload.orderRef },
    data: {
      status: payload.status === 'confirmed' ? 'CAPTURED' : payload.status === 'failed' ? 'FAILED' : 'PENDING',
    },
  })

  return NextResponse.json({ acknowledged: true })
}
