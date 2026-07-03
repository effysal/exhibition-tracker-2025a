// Usage: npm run create-user -- <email> <password>
import "dotenv/config";
import { pool, initSchema } from "./db.js";
import { hashPassword } from "./auth.js";

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Usage: npm run create-user -- <email> <password>");
  process.exit(1);
}

await initSchema();

const passwordHash = await hashPassword(password);
await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [email.toLowerCase(), passwordHash],
);

console.log(`User ${email} created/updated.`);
await pool.end();
