import { NextRequest, NextResponse } from 'next/server'

import { prisma } from '@/lib/db'
import { fetchWooCommerceProducts } from '@/lib/woocommerce'
import { toACPProduct } from '@/lib/acp'
import { toAP2Product } from '@/lib/ap2'

export async function GET(request: NextRequest) {
  const merchantId = request.nextUrl.searchParams.get('merchantId')
  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
  }

  const products = await prisma.product.findMany({ where: { merchantId } })
  return NextResponse.json({
    merchantId,
    products: products.map((product) => ({
      base: product,
      acp: toACPProduct(product),
      ap2: toAP2Product(product),
    })),
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { merchantId, wooCommerce } = body as {
    merchantId: string
    wooCommerce: { storeUrl: string; key: string; secret: string }
  }

  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
  }

  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } })
  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
  }

  const products = await fetchWooCommerceProducts(wooCommerce)

  await prisma.$transaction(
    products.map((product) => {
      const price = Number.parseFloat(product.price ?? '0') || 0
      const stock = product.stock_quantity ?? null
      const currency = product.currency ?? 'USD'

      return prisma.product.upsert({
        where: { id: product.id.toString() },
        update: {
          name: product.name,
          sku: product.sku,
          price,
          stock,
          currency,
          formatACP: null,
          formatAP2: null,
        },
        create: {
          id: product.id.toString(),
          merchantId,
          name: product.name,
          sku: product.sku,
          price,
          stock,
          currency,
          formatACP: null,
          formatAP2: null,
        },
      })
    })
  )

  const stored = await prisma.product.findMany({ where: { merchantId } })

  return NextResponse.json({
    merchantId,
    count: stored.length,
  })
}
