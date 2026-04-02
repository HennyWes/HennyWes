import { NextRequest, NextResponse } from 'next/server'
import { getProperty } from '@/lib/db/queries/properties'
import { getCompsForProperty, analyzeComps } from '@/lib/db/queries/comps'
import { createOutreachMessage } from '@/lib/db/queries/outreach'
import { getSetting } from '@/lib/db/queries/settings'
import { generateCallScript, generateSms, generateEmail } from '@/lib/ai/generators'
import { DEFAULT_MODEL } from '@/lib/ai/client'
import type { OutreachType } from '@/types/outreach'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10)
    const property = getProperty(id)
    if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { types }: { types: OutreachType[] } = await req.json()

    const comps = getCompsForProperty(id)
    const compsAnalysis = analyzeComps(comps, property.sq_ft)

    const investor = {
      name: getSetting('investor_name') ?? 'The Investor',
      company: getSetting('investor_company') ?? 'Cash Home Buyers',
      phone: getSetting('investor_phone') ?? '',
    }

    const ctx = {
      property,
      ownerName: property.owner_name ?? 'Homeowner',
      compsAnalysis,
      investor,
    }

    const result: Record<string, unknown> = {}

    await Promise.all(
      types.map(async (type) => {
        if (type === 'call_script') {
          const { script, tokens } = await generateCallScript(ctx)
          createOutreachMessage({
            property_id: id,
            message_type: 'call_script',
            body: script,
            ai_model: DEFAULT_MODEL,
            prompt_tokens: tokens,
          })
          result.call_script = script
        } else if (type === 'sms') {
          const { sms, tokens } = await generateSms(ctx)
          createOutreachMessage({
            property_id: id,
            message_type: 'sms',
            body: sms,
            ai_model: DEFAULT_MODEL,
            prompt_tokens: tokens,
          })
          result.sms = sms
        } else if (type === 'email') {
          const { subject, body, tokens } = await generateEmail(ctx)
          createOutreachMessage({
            property_id: id,
            message_type: 'email',
            subject,
            body,
            ai_model: DEFAULT_MODEL,
            prompt_tokens: tokens,
          })
          result.email = { subject, body }
        }
      })
    )

    return NextResponse.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
