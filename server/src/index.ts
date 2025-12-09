import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./env";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail, renderContactEmail, renderOrderEmail } from "./email";
import { sendWhatsApp } from "./whatsapp";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));

function setSessionCookie(res: any, user: { id: number; email: string; name: string }) {
  const token = jwt.sign({ sub: user.id, email: user.email, name: user.name }, env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("session", token, { httpOnly: true, sameSite: "lax" });
}

type SessionPayload = { sub: number; email: string; name: string; iat?: number; exp?: number };

function requireUser(req: any) {
  const token = req.cookies?.session;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as SessionPayload;
    return payload;
  } catch {
    return null;
  }
}

app.post("/api/auth/register", async (req: any, res: any) => {
  const schema = z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const { name, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "email_taken" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });
  setSessionCookie(res, { id: user.id, email: user.email, name: user.name });
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

app.post("/api/auth/login", async (req: any, res: any) => {
  const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "invalid_credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });
  setSessionCookie(res, { id: user.id, email: user.email, name: user.name });
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

app.post("/api/auth/logout", async (req: any, res: any) => {
  res.clearCookie("session");
  res.json({ ok: true });
});

app.get("/api/auth/me", async (req: any, res: any) => {
  const payload = requireUser(req);
  if (!payload) return res.status(401).json({ error: "unauthenticated" });
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return res.status(401).json({ error: "unauthenticated" });
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

app.post("/api/contact", async (req: any, res: any) => {
  const schema = z.object({ name: z.string().min(1), email: z.string().email(), message: z.string().min(1) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const msg = await prisma.contactMessage.create({ data: parsed.data });
  const email = renderContactEmail({ name: msg.name, email: msg.email, message: msg.message });
  const to = env.OWNER_EMAIL || env.MAIL_FROM;
  const sent = await sendEmail(to, "Nouveau message de contact", email.html, { attachments: email.attachments, replyTo: msg.email });
  res.json({ id: msg.id, previewUrl: sent.previewUrl });
});

app.get("/api/contact", (req: any, res: any) => {
  res.type("text/plain").send("Cette route accepte uniquement POST. Utilisez POST /api/contact avec {name,email,message}.");
});

app.post("/api/orders", async (req: any, res: any) => {
  const schema = z.object({
    items: z.array(z.object({ slug: z.string(), name: z.string(), price: z.number(), qty: z.number().min(1) })).min(1),
    address: z.string().min(3),
    phone: z.string().min(6),
    total: z.number(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "invalid_input" });
  const payload = requireUser(req);
  const userId = payload?.sub as number | undefined;
  const order = await prisma.order.create({
    data: {
      userId,
      address: parsed.data.address,
      phone: parsed.data.phone,
      total: parsed.data.total,
      items: {
        create: parsed.data.items.map((i) => ({ productSlug: i.slug, name: i.name, price: i.price, qty: i.qty })),
      },
    },
    include: { items: true, user: true },
  });
  const email = renderOrderEmail(order);
  const emailTo = order.user?.email || "client@kabro.local";
  const sent = await sendEmail(emailTo, "Confirmation de commande", email.html, { attachments: email.attachments });
  const waBody = `Nouvelle commande #${order.id}\nTotal: ${order.total} DH\nClient: ${order.user?.name || "Invité"}\nTel: ${order.phone}\nAdresse: ${order.address}`;
  await sendWhatsApp(waBody);
  res.json({ id: order.id, previewUrl: sent.previewUrl });
});

app.get("/", (req: any, res: any) => {
  res.type("text/html").send(`<html><head><meta charset="utf-8" /><title>Kabro API</title></head><body style="font-family: system-ui; padding: 24px;"><h1>Kabro API</h1><p>Serveur opérationnel sur port ${env.PORT}</p><p>Endpoints disponibles:</p><ul><li>POST /api/contact</li><li>POST /api/orders</li><li>GET /api/auth/me</li></ul></body></html>`);
});

app.listen(env.PORT, () => {
  console.log(`API on http://localhost:${env.PORT}`);
});
