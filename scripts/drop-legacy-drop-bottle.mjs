import pg from "pg";

const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) process.exit(1);

const client = new pg.Client({
  host: "db.ymvgwcsrkcbiwgbqtdgp.supabase.co",
  port: 5432,
  user: "postgres",
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(`
  drop function if exists public.drop_bottle(uuid, double precision, double precision, text, text);
  notify pgrst, 'reload schema';
`);
const { rows } = await client.query(`
  select pg_get_function_arguments(p.oid) as args
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'drop_bottle'
`);
console.log(rows);
await client.end();
