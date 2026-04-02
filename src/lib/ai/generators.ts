import { getGroqClient, DEFAULT_MODEL } from './client'
import type { Property } from '@/types/property'
import type { CompsAnalysis } from '@/types/comps'

export interface InvestorProfile {
  name: string
  company: string
  phone: string
}

export interface OutreachContext {
  property: Property
  ownerName: string
  compsAnalysis?: CompsAnalysis | null
  investor: InvestorProfile
}

function buildPropertyContext(ctx: OutreachContext): string {
  const p = ctx.property
  const lines: string[] = [
    `Property: ${p.address}, ${p.city}, ${p.state} ${p.zip}`,
    `Owner: ${ctx.ownerName}`,
    `Type: ${p.property_type ?? 'Unknown'}, ${p.bedrooms ?? '?'}bd/${p.bathrooms ?? '?'}ba, ${p.sq_ft ? p.sq_ft.toLocaleString() + ' sqft' : 'sqft unknown'}`,
    `Year Built: ${p.year_built ?? 'Unknown'}`,
    `Estimated Value: ${p.estimated_value ? '$' + p.estimated_value.toLocaleString() : 'Unknown'}`,
    `Estimated Equity: ${p.equity_percent ? p.equity_percent.toFixed(0) + '%' : 'Unknown'}`,
    `Last Sale: ${p.last_sale_price ? '$' + p.last_sale_price.toLocaleString() : 'Unknown'} on ${p.last_sale_date ?? 'Unknown'}`,
  ]

  const flags: string[] = []
  if (p.pre_foreclosure) flags.push('Pre-foreclosure')
  if (p.tax_delinquent) flags.push('Tax delinquent')
  if (p.vacant) flags.push('Vacant')
  if (p.absentee_owner) flags.push('Absentee owner')
  if (p.bankruptcy) flags.push('Bankruptcy')
  if (flags.length) lines.push(`Distress signals: ${flags.join(', ')}`)

  if (ctx.compsAnalysis?.suggested_arv) {
    lines.push(`Comps-based ARV: $${ctx.compsAnalysis.suggested_arv.toLocaleString()}`)
    lines.push(`Suggested max offer (70% rule): $${ctx.compsAnalysis.suggested_max_offer?.toLocaleString() ?? 'N/A'}`)
  }

  if (p.arv) lines.push(`Investor ARV: $${p.arv.toLocaleString()}`)
  if (p.max_offer) lines.push(`Investor max offer: $${p.max_offer.toLocaleString()}`)

  return lines.join('\n')
}

export async function generateCallScript(ctx: OutreachContext): Promise<{ script: string; tokens: number }> {
  const client = getGroqClient()
  const propertyCtx = buildPropertyContext(ctx)

  const prompt = `You are a real estate investor's assistant helping write a professional, friendly cold call script.

INVESTOR PROFILE:
Name: ${ctx.investor.name}
Company: ${ctx.investor.company}
Phone: ${ctx.investor.phone}

PROPERTY DETAILS:
${propertyCtx}

Write a conversational cold call script (max 280 words) that:
1. Opens with investor's name and company
2. References ONE specific property fact to show you're informed (equity, distress signal, or ownership duration)
3. Explains you buy houses cash, fast close, as-is — no repairs, no agent fees
4. Asks if the owner has thought about selling
5. Includes 3 common objection handlers labeled clearly:
   - "Not Interested": [response]
   - "Already Listed": [response]
   - "What's Your Offer?": [response — keep vague, say you'll need to assess condition]

Format the script with clear section labels. Keep it natural and conversational, not salesy.`

  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 700,
  })

  return {
    script: completion.choices[0].message.content ?? '',
    tokens: completion.usage?.total_tokens ?? 0,
  }
}

export async function generateSms(ctx: OutreachContext): Promise<{ sms: string; tokens: number }> {
  const client = getGroqClient()
  const propertyCtx = buildPropertyContext(ctx)

  const prompt = `You are helping a real estate investor write a cold outreach SMS.

INVESTOR PROFILE:
Name: ${ctx.investor.name}
Company: ${ctx.investor.company}
Phone: ${ctx.investor.phone}

PROPERTY DETAILS:
${propertyCtx}

Write a SHORT text message (under 160 characters) to the property owner. Requirements:
- Sound like a real person, not a bot
- Mention you're interested in buying their property at [address]
- Include investor's name
- End with a question or call to action
- Do NOT use all caps, emojis, or spammy language

Output ONLY the text message, nothing else.`

  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 100,
  })

  return {
    sms: completion.choices[0].message.content?.trim() ?? '',
    tokens: completion.usage?.total_tokens ?? 0,
  }
}

export async function generateEmail(ctx: OutreachContext): Promise<{ subject: string; body: string; tokens: number }> {
  const client = getGroqClient()
  const propertyCtx = buildPropertyContext(ctx)

  const prompt = `You are helping a real estate investor write a cold outreach email to a property owner.

INVESTOR PROFILE:
Name: ${ctx.investor.name}
Company: ${ctx.investor.company}
Phone: ${ctx.investor.phone}

PROPERTY DETAILS:
${propertyCtx}

Write a professional but friendly email. Include:
- A subject line on the first line, prefixed with "SUBJECT: "
- A blank line
- Then the email body (3 short paragraphs, under 200 words total)
  - Paragraph 1: Who you are and why you're reaching out (mention the property)
  - Paragraph 2: Your value proposition (cash, fast close, as-is, no fees)
  - Paragraph 3: Soft call to action — no pressure, just open the door

Sign with the investor's name, company, and phone number.`

  const completion = await client.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 400,
  })

  const raw = completion.choices[0].message.content ?? ''
  const lines = raw.split('\n')
  let subject = ''
  let bodyLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('SUBJECT:')) {
      subject = lines[i].replace('SUBJECT:', '').trim()
    } else if (subject && lines[i].trim() !== '') {
      bodyLines = lines.slice(i)
      break
    }
  }

  return {
    subject: subject || `Quick question about your property at ${ctx.property.address}`,
    body: bodyLines.join('\n').trim() || raw,
    tokens: completion.usage?.total_tokens ?? 0,
  }
}
