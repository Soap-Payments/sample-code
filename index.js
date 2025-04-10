import express from 'express'
import bodyParser from 'body-parser'
import fetch from 'node-fetch'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

async function createSoapCheckout(type) {
  const SOAP_URL = process.env.SOAP_URL // https://api-sandbox.soap.com/api/vi
  const SOAP_API_KEY = process.env.SOAP_API_KEY
  const CHECKOUT_URL = `${SOAP_URL}/checkouts`
  
  let body = {
    customer_id: '1234567890',// the Soap Customer ID of the logged in user
    type: type
  }

  // Sweeps or In-Game Currency
  // body.line_items = [{
  //   product_id: pr_123, // you created this product in Soap Dashboard
  //   quantity: 1,
  // }]

  if (type === 'withdrawal') {
    body.balance_amount_cents = 10000 // the user's withdrawable balance in cents
  }

  const response = await fetch(CHECKOUT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SOAP_API_KEY}` },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error('Failed to create checkout')
  }

  const data = await response.json()
  return data.url // pass url to client for redirect
}

app.post('/submit', async (req, res) => {
  const { type } = req.body

  try {
    const redirectUrl = await createSoapCheckout(type)
    res.redirect(redirectUrl)
  } catch (err) {
    console.error(err)
    res.status(500).send('Error creating checkout')
  }
})

app.listen(8008, () => {
  console.log('Server running at http://localhost:3000')
})