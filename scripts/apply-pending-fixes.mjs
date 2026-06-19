/**
 * Applies 008_apply_pending_fixes.sql to Supabase Postgres.
 * Usage: SUPABASE_DB_PASSWORD=your-db-password node scripts/apply-pending-fixes.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const projectRef = "ymvgwcsrkcbiwgbqtdgp";
const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) {
  console.error("Set SUPABASE_DB_PASSWORD (Supabase → Settings → Database → password)");
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, "..", "supabase", "migrations", "008_apply_pending_fixes.sql");
const sql = readFileSync(sqlPath, "utf8");

const client = new pg.Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  user: "postgres",
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const diagnostics = `
select p.proname, pg_get_function_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'drop_bottle';

select slug, name, cap_cost, is_sealed from public.bottle_types order by duration_hours;

select u.email, p.bottle_caps, p.is_admin
from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = lower('dreamernight@gmail.com');
`;

async function main() {
  await client.connect();
  console.log("Applying pending fixes...");
  await client.query(sql);
  console.log("Done. Running diagnostics...\n");

  const checks = diagnostics.trim().split(";").filter((s) => s.trim());
  for (const q of checks) {
    const { rows } = await client.query(q);
    console.log(JSON.stringify(rows, null, 2));
    console.log("---");
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
