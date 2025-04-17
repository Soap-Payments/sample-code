import crypto from 'crypto'

export function verifySignature(rawBody, signatureHeader) {
  const parts = signatureHeader.split(',')
  const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1]
  const signature = parts.find(p => p.startsWith('v1='))?.split('=')[1]
  if (!timestamp || !signature) return false

  const message = `${timestamp}.${rawBody}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.SOAP_WEBHOOK_SECRET_SIGNING_KEY)
    .update(message)
    .digest('hex')

  try {
    const r = Buffer.from(signature, 'hex')
    const e = Buffer.from(expectedSignature, 'hex')
    return r.length === e.length && crypto.timingSafeEqual(r, e)
  } catch {
    return false
  }
}

export function processEvent(event) {
  const { type: eventType, data } = event
  const amount = data.charge.amount_cents
  const txType = data.charge.transaction_type

  switch (eventType) {
    case 'checkout.succeeded':
      // if it's a credit, we need to add the amount to the balance
      // if it's a debit, we don't need to do anything since the balance is already updated in the hold event
      return txType === 'credit' ? { balance_change_amount_cents: amount } : { balance_change_amount_cents: 0}
    case 'checkout.hold':
      return { balance_change_amount_cents: -amount }
    case 'checkout.release_hold':
      return { balance_change_amount_cents: amount }
    case 'checkout.returned':
      // undo the previous transaction bc the payment bounced
      // if it was a debit you need to add back balance
      // if it was a credit you need to subtract balance
      if (txType === 'debit') return { balance_change_amount_cents: amount }
      if (txType === 'credit') return { balance_change_amount_cents: -amount }
    case 'checkout.failed':
      // dont need to do anything here, mostly for tracking purposes and/or you want to disable user accounts for suspicious activity
    default:
      throw new Error(`Unknown event type: ${eventType}`)
  }
}
