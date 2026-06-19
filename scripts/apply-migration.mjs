/**
 * Apply a SQL migration file to Supabase Postgres.
 * Usage: SUPABASE_DB_PASSWORD=... node scripts/apply-migration.mjs 009_shop_social_rpcs.sql
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const projectRef = "ymvgwcsrkcbiwgbqtdgp";
const file = process.argv[2] ?? "009_shop_social_rpcs.sql";
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error("Set SUPABASE_DB_PASSWORD");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "..", "supabase", "migrations", file);
const sql = readFileSync(sqlPath, "utf8");

const client = new pg.Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  user: "postgres",
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const checks = `
select proname, pg_get_function_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname in ('place_signal_tower', 'create_footprint', 'nearby_signal_towers', 'list_my_footprints')
order by proname;
`;

await client.connect();
console.log(`Applying ${file}...`);
await client.query(sql);
console.log("Done.\n");
const { rows } = await client.query(checks);
console.log(JSON.stringify(rows, null, 2));
await client.end();
