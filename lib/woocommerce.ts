import crypto from 'node:crypto'

export type WooCommerceProduct = {
  id: number
  name: string
  sku?: string
  price: string
  stock_quantity?: number
  currency?: string
  images?: { src: string }[]
  description?: string
}

type WooConfig = {
  storeUrl: string
  key: string
  secret: string
}

const apiVersion = 'wc/v3'

function getAuthHeader({ key, secret }: WooConfig, method: string, path: string, params: URLSearchParams) {
  const oauth = new URLSearchParams({
    oauth_consumer_key: key,
    oauth_nonce: crypto.randomUUID(),
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
  })

  const baseParams = new URLSearchParams([...params, ...oauth])
  const baseString = [method.toUpperCase(), encodeURIComponent(path), encodeURIComponent(baseParams.toString())].join('&')
  const signature = crypto.createHmac('sha256', `${secret}&`).update(baseString).digest('base64')
  oauth.set('oauth_signature', signature)

  return `OAuth ${Array.from(oauth.entries())
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ')}`
}

export async function fetchWooCommerceProducts(config: WooConfig): Promise<WooCommerceProduct[]> {
  const resource = `/wp-json/${apiVersion}/products`
  const url = new URL(resource, config.storeUrl)
  const params = new URLSearchParams({ per_page: '100' })
  url.search = params.toString()

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: getAuthHeader(config, 'GET', url.origin + resource, params),
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`WooCommerce request failed with status ${response.status}`)
  }

  return (await response.json()) as WooCommerceProduct[]
}
