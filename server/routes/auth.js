import { Router } from "express";
import { pool } from "../db.js";
import { verifyPassword, issueToken, setSessionCookie, clearSessionCookie, requireAuth } from "../auth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = issueToken(user);
  setSessionCookie(res, token);
  res.json({ email: user.email });
});

authRouter.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ email: req.user.email });
});
