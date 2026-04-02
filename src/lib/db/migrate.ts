import type Database from 'better-sqlite3'

const MIGRATIONS: Array<{ version: number; up: (db: Database.Database) => void }> = [
  {
    version: 1,
    up: (db) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key        TEXT PRIMARY KEY,
          value      TEXT NOT NULL,
          updated_at INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS properties (
          id                    INTEGER PRIMARY KEY AUTOINCREMENT,
          external_id           TEXT UNIQUE,
          address               TEXT NOT NULL,
          city                  TEXT NOT NULL,
          state                 TEXT NOT NULL,
          zip                   TEXT NOT NULL,
          county                TEXT,
          parcel_number         TEXT,
          property_type         TEXT,
          bedrooms              INTEGER,
          bathrooms             REAL,
          sq_ft                 INTEGER,
          lot_size_sqft         INTEGER,
          year_built            INTEGER,
          stories               INTEGER,
          garage                TEXT,
          pool                  INTEGER DEFAULT 0,
          estimated_value       INTEGER,
          assessed_value        INTEGER,
          tax_assessed_value    INTEGER,
          last_sale_price       INTEGER,
          last_sale_date        TEXT,
          estimated_equity      INTEGER,
          equity_percent        REAL,
          mortgage_balance      INTEGER,
          open_lien_count       INTEGER DEFAULT 0,
          lien_amount           INTEGER,
          pre_foreclosure       INTEGER DEFAULT 0,
          foreclosure           INTEGER DEFAULT 0,
          reo                   INTEGER DEFAULT 0,
          bankruptcy            INTEGER DEFAULT 0,
          tax_delinquent        INTEGER DEFAULT 0,
          vacant                INTEGER DEFAULT 0,
          absentee_owner        INTEGER DEFAULT 0,
          owner_name            TEXT,
          owner_mailing_address TEXT,
          owner_mailing_city    TEXT,
          owner_mailing_state   TEXT,
          owner_mailing_zip     TEXT,
          status                TEXT NOT NULL DEFAULT 'new',
          source                TEXT NOT NULL DEFAULT 'manual',
          import_batch_id       TEXT,
          notes                 TEXT,
          arv                   INTEGER,
          max_offer             INTEGER,
          created_at            INTEGER NOT NULL DEFAULT (unixepoch()),
          updated_at            INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE INDEX IF NOT EXISTS idx_properties_status  ON properties(status);
        CREATE INDEX IF NOT EXISTS idx_properties_zip     ON properties(zip);
        CREATE INDEX IF NOT EXISTS idx_properties_state   ON properties(state);
        CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at DESC);

        CREATE TABLE IF NOT EXISTS contacts (
          id           INTEGER PRIMARY KEY AUTOINCREMENT,
          property_id  INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
          full_name    TEXT,
          relationship TEXT,
          email        TEXT,
          age          INTEGER,
          deceased     INTEGER DEFAULT 0,
          created_at   INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE INDEX IF NOT EXISTS idx_contacts_property ON contacts(property_id);

        CREATE TABLE IF NOT EXISTS contact_phones (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          contact_id  INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
          phone       TEXT NOT NULL,
          phone_type  TEXT,
          do_not_call INTEGER DEFAULT 0,
          rank        INTEGER DEFAULT 0,
          created_at  INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE INDEX IF NOT EXISTS idx_phones_contact ON contact_phones(contact_id);

        CREATE TABLE IF NOT EXISTS comps (
          id               INTEGER PRIMARY KEY AUTOINCREMENT,
          property_id      INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
          comp_address     TEXT NOT NULL,
          comp_city        TEXT,
          comp_state       TEXT,
          comp_zip         TEXT,
          sale_price       INTEGER NOT NULL,
          sale_date        TEXT NOT NULL,
          sq_ft            INTEGER,
          bedrooms         INTEGER,
          bathrooms        REAL,
          year_built       INTEGER,
          distance_miles   REAL,
          price_per_sqft   REAL,
          arv_contribution INTEGER DEFAULT 0,
          pulled_at        INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE INDEX IF NOT EXISTS idx_comps_property ON comps(property_id);

        CREATE TABLE IF NOT EXISTS campaigns (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          name        TEXT NOT NULL,
          description TEXT,
          status      TEXT NOT NULL DEFAULT 'active',
          created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
          updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS campaign_properties (
          campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
          property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
          added_at    INTEGER NOT NULL DEFAULT (unixepoch()),
          PRIMARY KEY (campaign_id, property_id)
        );

        CREATE TABLE IF NOT EXISTS outreach_messages (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          property_id   INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
          contact_id    INTEGER REFERENCES contacts(id),
          campaign_id   INTEGER REFERENCES campaigns(id),
          message_type  TEXT NOT NULL,
          subject       TEXT,
          body          TEXT NOT NULL,
          status        TEXT NOT NULL DEFAULT 'generated',
          sent_at       INTEGER,
          replied_at    INTEGER,
          notes         TEXT,
          ai_model      TEXT,
          prompt_tokens INTEGER,
          created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
          updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
        );

        CREATE INDEX IF NOT EXISTS idx_outreach_property ON outreach_messages(property_id);
        CREATE INDEX IF NOT EXISTS idx_outreach_type     ON outreach_messages(message_type);
        CREATE INDEX IF NOT EXISTS idx_outreach_status   ON outreach_messages(status);
        CREATE INDEX IF NOT EXISTS idx_outreach_campaign ON outreach_messages(campaign_id);
      `)
    },
  },
]

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)

  const getVersion = db.prepare<[], { version: number }>(
    'SELECT MAX(version) as version FROM schema_migrations'
  )
  const row = getVersion.get()
  const currentVersion = row?.version ?? 0

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      db.transaction(() => {
        migration.up(db)
        db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(migration.version)
      })()
      console.log(`[DB] Migration ${migration.version} applied`)
    }
  }
}
