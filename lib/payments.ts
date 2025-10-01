import { prisma } from './db'
import { verifySharedPaymentToken } from './stripe'
import type { ACPCheckoutRequest, ACPCheckoutResponse } from './acp'
import type { AP2CheckoutRequest, AP2CheckoutResponse } from './ap2'

export async function handleACPCheckout(payload: ACPCheckoutRequest): Promise<ACPCheckoutResponse> {
  if (!payload.items?.length) {
    throw new Error('No items provided in checkout payload')
  }

  await verifySharedPaymentToken(payload.paymentToken)

  const product = await prisma.product.findUnique({ where: { id: payload.items[0]?.productId } })
  if (!product) {
    throw new Error('Product not found')
  }

  const amount = product.price * (payload.items[0]?.quantity ?? 1)

  const order = await prisma.order.create({
    data: {
      merchantId: product.merchantId,
      productId: product.id,
      protocol: 'ACP',
      status: 'AUTHORIZED',
      amount,
      externalId: payload.cartId,
      metadata: payload.metadata ?? {},
    },
  })

  return { orderId: order.id, status: 'authorized' }
}

export async function handleAP2Checkout(payload: AP2CheckoutRequest): Promise<AP2CheckoutResponse> {
  if (!payload.lineItems?.length) {
    throw new Error('No line items provided in checkout payload')
  }

  const product = await prisma.product.findUnique({ where: { id: payload.lineItems[0]?.productId } })
  if (!product) {
    throw new Error('Product not found')
  }

  const amount = product.price * (payload.lineItems[0]?.quantity ?? 1)

  const order = await prisma.order.create({
    data: {
      merchantId: product.merchantId,
      productId: product.id,
      protocol: 'AP2',
      status: payload.intent === 'charge' ? 'CAPTURED' : 'PENDING',
      amount,
      externalId: payload.paymentMethod.token,
      metadata: payload.metadata ?? {},
    },
  })

  return { orderId: order.id, status: order.status === 'CAPTURED' ? 'confirmed' : 'pending' }
}
