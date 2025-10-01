import type { Product } from '@prisma/client'

export type ACPProduct = {
  id: string
  title: string
  description?: string
  price: {
    amount: number
    currency: string
  }
  availability: 'in_stock' | 'out_of_stock'
  media?: {
    url: string
    type: 'image'
  }[]
}

export function toACPProduct(product: Product): ACPProduct {
  const base = product.formatACP as Partial<ACPProduct> | null

  return {
    id: product.id,
    title: product.name,
    description: base?.description ?? undefined,
    price: {
      amount: product.price,
      currency: product.currency ?? 'USD',
    },
    availability: product.stock === undefined || product.stock > 0 ? 'in_stock' : 'out_of_stock',
    media: base?.media,
  }
}

export type ACPCheckoutRequest = {
  cartId: string
  items: {
    productId: string
    quantity: number
  }[]
  paymentToken: string
  metadata?: Record<string, unknown>
}

export type ACPCheckoutResponse = {
  orderId: string
  status: 'authorized' | 'requires_action' | 'failed'
}
