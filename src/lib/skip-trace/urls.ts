/**
 * URL builders for people search sites.
 * Pure functions — safe to use in both client and server components.
 */

export interface OwnerLookupInput {
  owner_name: string
  address: string
  city: string
  state: string
  zip: string
}

export function buildTruePeopleSearchUrl(input: OwnerLookupInput): string {
  const params = new URLSearchParams({
    name: input.owner_name.trim(),
    citystatezip: `${input.city} ${input.state} ${input.zip}`.trim(),
  })
  return `https://www.truepeoplesearch.com/results?${params.toString()}`
}

export function buildLookupIoUrl(input: OwnerLookupInput): string {
  return `https://lookup.io/name/${encodeURIComponent(input.owner_name.trim())}/${input.state.toUpperCase()}`
}

export function buildFastPeopleSearchUrl(input: OwnerLookupInput): string {
  const name = input.owner_name.trim().toLowerCase().replace(/\s+/g, '-')
  return `https://www.fastpeoplesearch.com/name/${encodeURIComponent(name)}_${input.state.toUpperCase()}`
}
