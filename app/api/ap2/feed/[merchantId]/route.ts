import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { toAP2Product } from '@/lib/ap2'

export async function GET(_request: NextRequest, { params }: { params: { merchantId: string } }) {
  const merchant = await prisma.merchant.findUnique({ where: { id: params.merchantId }, include: { products: true } })

  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
  }

  return NextResponse.json({
    merchant: {
      id: merchant.id,
      name: merchant.name,
      platform: merchant.platform,
    },
    products: merchant.products.map(toAP2Product),
  })
}
