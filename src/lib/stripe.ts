import Stripe from 'stripe'

let client: Stripe | null = null

/**
 * Lazily create the Stripe client so the app can build and run
 * without STRIPE_SECRET_KEY (payments are then reported as not configured).
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  if (!client) client = new Stripe(key, { apiVersion: '2026-05-27.dahlia' })
  return client
}
