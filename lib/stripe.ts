import Stripe from 'stripe'

const apiKey = process.env.STRIPE_API_KEY

export function getStripeClient() {
  if (!apiKey) {
    throw new Error('STRIPE_API_KEY is not configured')
  }

  return new Stripe(apiKey, {
    apiVersion: '2024-12-18.acacia',
  })
}

export async function verifySharedPaymentToken(token: string) {
  const stripe = getStripeClient() as Stripe & {
    agentCommerce?: {
      sharedPaymentTokens: {
        retrieve(id: string): Promise<{ status: string }>
      }
    }
  }

  const tokenDetails = await stripe.agentCommerce?.sharedPaymentTokens.retrieve(token)
  if (!tokenDetails || tokenDetails.status !== 'active') {
    throw new Error('Shared Payment Token is not active')
  }
  return tokenDetails
}
