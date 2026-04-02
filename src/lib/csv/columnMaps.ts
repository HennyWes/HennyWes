/**
 * Maps PropStream CSV column header variations to canonical field names.
 * PropStream's export headers vary slightly between export types.
 */

export type CsvField = keyof typeof COLUMN_ALIASES

export const COLUMN_ALIASES: Record<string, string> = {
  // Address
  'property address': 'address',
  'address': 'address',
  'situs address': 'address',
  'street address': 'address',

  // City
  'city': 'city',
  'property city': 'city',
  'situs city': 'city',

  // State
  'state': 'state',
  'property state': 'state',
  'situs state': 'state',

  // ZIP
  'zip': 'zip',
  'zip code': 'zip',
  'postal code': 'zip',
  'property zip': 'zip',
  'situs zip': 'zip',

  // County
  'county': 'county',
  'property county': 'county',

  // Parcel
  'parcel number': 'parcel_number',
  'apn': 'parcel_number',
  'tax id': 'parcel_number',
  'parcel id': 'parcel_number',

  // Property type
  'property type': 'property_type',
  'use type': 'property_type',
  'land use': 'property_type',

  // Beds/baths
  'bedrooms': 'bedrooms',
  'beds': 'bedrooms',
  'bd': 'bedrooms',
  'bathrooms': 'bathrooms',
  'baths': 'bathrooms',
  'ba': 'bathrooms',
  'full baths': 'bathrooms',

  // Size
  'sq ft': 'sq_ft',
  'sqft': 'sq_ft',
  'square feet': 'sq_ft',
  'building size': 'sq_ft',
  'living sq ft': 'sq_ft',

  'lot size': 'lot_size_sqft',
  'lot sq ft': 'lot_size_sqft',
  'lot size sqft': 'lot_size_sqft',

  // Year
  'year built': 'year_built',
  'yr built': 'year_built',

  // Value
  'estimated value': 'estimated_value',
  'est value': 'estimated_value',
  'avm': 'estimated_value',
  'market value': 'estimated_value',

  'assessed value': 'assessed_value',
  'assess value': 'assessed_value',

  'last sale price': 'last_sale_price',
  'sale price': 'last_sale_price',
  'sold price': 'last_sale_price',

  'last sale date': 'last_sale_date',
  'sale date': 'last_sale_date',
  'sold date': 'last_sale_date',

  // Equity
  'estimated equity': 'estimated_equity',
  'est equity': 'estimated_equity',
  'equity': 'estimated_equity',

  'equity percent': 'equity_percent',
  'equity %': 'equity_percent',
  '% equity': 'equity_percent',

  'mortgage balance': 'mortgage_balance',
  'loan balance': 'mortgage_balance',
  'open mortgage balance': 'mortgage_balance',

  // Distress
  'pre foreclosure': 'pre_foreclosure',
  'preforeclosure': 'pre_foreclosure',
  'in foreclosure': 'foreclosure',
  'foreclosure': 'foreclosure',
  'reo': 'reo',
  'bank owned': 'reo',
  'bankruptcy': 'bankruptcy',
  'tax delinquent': 'tax_delinquent',
  'delinquent taxes': 'tax_delinquent',
  'vacant': 'vacant',
  'vacancy': 'vacant',
  'absentee owner': 'absentee_owner',
  'absentee': 'absentee_owner',

  // Owner
  'owner name': 'owner_name',
  'owner': 'owner_name',
  'current owner': 'owner_name',
  'mailing address': 'owner_mailing_address',
  'owner mailing address': 'owner_mailing_address',
  'mailing city': 'owner_mailing_city',
  'owner mailing city': 'owner_mailing_city',
  'mailing state': 'owner_mailing_state',
  'owner mailing state': 'owner_mailing_state',
  'mailing zip': 'owner_mailing_zip',
  'owner mailing zip': 'owner_mailing_zip',

  // Phone (from PropStream skip trace export)
  'phone 1': 'phone_1',
  'phone1': 'phone_1',
  'primary phone': 'phone_1',
  'phone 2': 'phone_2',
  'phone2': 'phone_2',
  'secondary phone': 'phone_2',
  'phone 3': 'phone_3',
  'phone3': 'phone_3',
  'email': 'email',
  'email address': 'email',
}

export function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/\s+/g, ' ')
}

export function mapHeader(header: string): string | null {
  return COLUMN_ALIASES[normalizeHeader(header)] ?? null
}
