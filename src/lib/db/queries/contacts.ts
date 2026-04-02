import { getDb } from '../index'
import type { Contact, ContactPhone, CreateContactInput } from '@/types/contact'

export function getContactsForProperty(propertyId: number): Contact[] {
  const db = getDb()
  const contacts = db.prepare<[number], Contact>(
    'SELECT * FROM contacts WHERE property_id = ? ORDER BY id'
  ).all(propertyId)

  for (const contact of contacts) {
    contact.phones = db.prepare<[number], ContactPhone>(
      'SELECT * FROM contact_phones WHERE contact_id = ? ORDER BY rank'
    ).all(contact.id)
  }

  return contacts
}

export function createContact(input: CreateContactInput): Contact {
  const db = getDb()

  const contact = db.prepare<object, Contact>(`
    INSERT INTO contacts (property_id, full_name, relationship, email, age)
    VALUES (@property_id, @full_name, @relationship, @email, @age)
    RETURNING *
  `).get({
    property_id: input.property_id,
    full_name: input.full_name ?? null,
    relationship: input.relationship ?? null,
    email: input.email ?? null,
    age: input.age ?? null,
  }) as Contact

  if (input.phones?.length) {
    const phoneStmt = db.prepare(`
      INSERT INTO contact_phones (contact_id, phone, phone_type, rank)
      VALUES (?, ?, ?, ?)
    `)
    const insertPhones = db.transaction(() => {
      input.phones!.forEach((p, i) => {
        phoneStmt.run(contact.id, p.phone, p.phone_type ?? null, p.rank ?? i)
      })
    })
    insertPhones()
  }

  contact.phones = db.prepare<[number], ContactPhone>(
    'SELECT * FROM contact_phones WHERE contact_id = ? ORDER BY rank'
  ).all(contact.id)

  return contact
}

export function deleteContactsForProperty(propertyId: number): void {
  getDb().prepare('DELETE FROM contacts WHERE property_id = ?').run(propertyId)
}

export function toggleDNC(phoneId: number, value: boolean): void {
  getDb().prepare('UPDATE contact_phones SET do_not_call = ? WHERE id = ?').run(value ? 1 : 0, phoneId)
}
