const { Client } = require('pg');

const client = new Client({
  host: 'db.nxqigztmyutmshmqtasg.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'TechHub2026Secure123',
  ssl: { rejectUnauthorized: false },
});

const VTPASS_CREDENTIALS = {
  name: 'VTpass',
  slug: 'vtpass',
  base_url: 'https://sandbox.vtpass.com/api',
  api_key: '7f705d1a1b825d1b5a9c2a36aa6481ea',
  public_key: 'PK_360c6f06ed392b39ce84ff59918ee4e53bf922cd256',
  secret_key: 'SK_2929192308a32c7d4cd4f22c016a0708636628be8b3',
  environment: 'sandbox',
  status: 'active',
  priority: 10,
  is_default: true,
  supported_services: JSON.stringify([
    'airtime', 'data', 'electricity', 'cable_tv',
    'internet', 'education', 'airtime_to_cash',
  ]),
};

async function seed() {
  await client.connect();

  const existing = await client.query(
    'SELECT id, name FROM vtu_providers WHERE slug = $1',
    [VTPASS_CREDENTIALS.slug]
  );

  if (existing.rows.length > 0) {
    console.log(`Provider "${VTPASS_CREDENTIALS.slug}" already exists (id: ${existing.rows[0].id}). Updating...`);

    await client.query(`
      UPDATE vtu_providers SET
        name = $2, base_url = $3, api_key = $4, public_key = $5, secret_key = $6,
        environment = $7, status = $8, priority = $9, is_default = $10,
        supported_services = $11, updated_at = NOW()
      WHERE slug = $1
    `, [
      VTPASS_CREDENTIALS.slug,
      VTPASS_CREDENTIALS.name,
      VTPASS_CREDENTIALS.base_url,
      VTPASS_CREDENTIALS.api_key,
      VTPASS_CREDENTIALS.public_key,
      VTPASS_CREDENTIALS.secret_key,
      VTPASS_CREDENTIALS.environment,
      VTPASS_CREDENTIALS.status,
      VTPASS_CREDENTIALS.priority,
      VTPASS_CREDENTIALS.is_default,
      VTPASS_CREDENTIALS.supported_services,
    ]);

    console.log('Provider updated successfully.');
  } else {
    console.log(`Inserting provider "${VTPASS_CREDENTIALS.slug}"...`);

    await client.query(`
      INSERT INTO vtu_providers (
        name, slug, base_url, api_key, public_key, secret_key,
        environment, status, priority, is_default, supported_services,
        total_requests, successful_requests, failed_requests, pending_requests,
        created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, 0,0,0,0, NOW(), NOW())
    `, [
      VTPASS_CREDENTIALS.name,
      VTPASS_CREDENTIALS.slug,
      VTPASS_CREDENTIALS.base_url,
      VTPASS_CREDENTIALS.api_key,
      VTPASS_CREDENTIALS.public_key,
      VTPASS_CREDENTIALS.secret_key,
      VTPASS_CREDENTIALS.environment,
      VTPASS_CREDENTIALS.status,
      VTPASS_CREDENTIALS.priority,
      VTPASS_CREDENTIALS.is_default,
      VTPASS_CREDENTIALS.supported_services,
    ]);

    console.log('Provider inserted successfully.');
  }

  const result = await client.query(
    'SELECT id, name, slug, status, is_default, environment FROM vtu_providers WHERE slug = $1',
    [VTPASS_CREDENTIALS.slug]
  );
  console.log('Verified:', JSON.stringify(result.rows[0], null, 2));

  await client.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
