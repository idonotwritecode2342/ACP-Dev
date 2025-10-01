import type { Product } from '@prisma/client'

export type AP2Product = {
  product: {
    id: string
    title: string
    description?: string
    media?: { url: string; kind: 'image' }[]
  }
  pricing: {
    amount: number
    currency: string
  }
  inventory: {
    available: number | null
  }
}

export function toAP2Product(product: Product): AP2Product {
  const base = product.formatAP2 as Partial<AP2Product> | null

  return {
    product: {
      id: product.id,
      title: product.name,
      description: base?.product?.description,
      media: base?.product?.media,
    },
    pricing: {
      amount: product.price,
      currency: product.currency ?? 'USD',
    },
    inventory: {
      available: product.stock ?? null,
    },
  }
}

export type AP2CheckoutRequest = {
  intent: 'authorize' | 'charge'
  lineItems: {
    productId: string
    quantity: number
  }[]
  paymentMethod: {
    provider: 'visa' | 'mastercard' | 'paypal' | 'coinbase'
    token: string
  }
  metadata?: Record<string, unknown>
}

export type AP2CheckoutResponse = {
  orderId: string
  status: 'pending' | 'confirmed' | 'failed'
}
