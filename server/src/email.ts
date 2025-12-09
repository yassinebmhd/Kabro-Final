import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { env } from "./env";

type MailOptions = { attachments?: any[]; replyTo?: string };

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getLogoAttachment() {
  try {
    const logoPath = path.resolve(process.cwd(), "../public/logo.svg");
    const content = fs.readFileSync(logoPath);
    return [{ filename: "logo.svg", content, cid: "kabro-logo", contentType: "image/svg+xml" }];
  } catch {
    return [];
  }
}

function baseTemplate(title: string, innerHtml: string) {
  const brandUrl = env.APP_URL;
  const accent = "#FFC107";
  return (
    `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/><title>${title}</title></head>` +
    `<body style="margin:0;padding:0;background-color:#0b0b0b;color:#ffffff;font-family:Inter,Arial,sans-serif;">` +
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0b0b0b;padding:32px 0;">` +
    `<tr><td align="center">` +
    `<table role="presentation" width="620" cellspacing="0" cellpadding="0" style="background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden">` +
    `<tr><td style="padding:20px 24px">` +
    `<table role="presentation" width="100%"><tr>` +
    `<td style="vertical-align:middle"><img src="cid:kabro-logo" alt="Kabro" width="40" height="40" style="display:block"/></td>` +
    `<td style="text-align:right;font-weight:800;letter-spacing:1px;color:${accent};font-size:18px">Kabro</td>` +
    `</tr></table>` +
    `</td></tr>` +
    `<tr><td style="height:4px;background:linear-gradient(90deg, ${accent} 0%, #E5A800 50%, #C48F00 100%)"></td></tr>` +
    `<tr><td style="padding:24px">${innerHtml}</td></tr>` +
    `<tr><td style="border-top:1px solid #2a2a2a;padding:16px 24px;color:#a0a0a0;font-size:12px">` +
    `Kabro • <a href="${brandUrl}" style="color:${accent};text-decoration:none">${brandUrl}</a> • Support 24/7` +
    `</td></tr>` +
    `</table>` +
    `</td></tr>` +
    `</table>` +
    `</body></html>`
  );
}

export function renderContactEmail(msg: { name: string; email: string; message: string }) {
  const inner =
    `<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#ffffff">Nouveau message de contact</h1>` +
    `<div style="display:flex;gap:16px;flex-wrap:wrap;margin:0 0 16px">` +
    `<div style="flex:1 1 260px"><div style="color:#a0a0a0;font-size:12px">Nom</div><div style="font-size:14px;font-weight:600;color:#ffffff">${escapeHtml(msg.name)}</div></div>` +
    `<div style="flex:1 1 260px"><div style="color:#a0a0a0;font-size:12px">Email</div><div style="font-size:14px;font-weight:600"><a href="mailto:${escapeHtml(msg.email)}" style="color:#FFC107;text-decoration:none">${escapeHtml(msg.email)}</a></div></div>` +
    `</div>` +
    `<div style="color:#a0a0a0;font-size:12px;margin-bottom:8px">Message</div>` +
    `<div style="background-color:#0f0f0f;border:1px solid #2a2a2a;border-radius:8px;padding:12px;color:#ffffff;font-size:14px;line-height:1.6">${escapeHtml(msg.message).replace(/\n/g, "<br>")}</div>` +
    `<div style="margin-top:20px"><a href="mailto:${escapeHtml(msg.email)}" style="display:inline-block;background-color:#FFC107;color:#000000;font-weight:700;padding:10px 16px;border-radius:999px;text-decoration:none">Répondre</a></div>`;
  const html = baseTemplate("Nouveau message de contact", inner);
  return { html, attachments: getLogoAttachment() };
}

export function renderOrderEmail(order: any) {
  const accent = "#FFC107";
  const items = Array.isArray(order.items) ? order.items : [];
  const rows = items
    .map(
      (i: any) =>
        `<tr>` +
        `<td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#ffffff">${escapeHtml(i.name)}</td>` +
        `<td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#ffffff" align="center">${i.qty}</td>` +
        `<td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#ffffff" align="right">${i.price} DH</td>` +
        `<td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#ffffff" align="right">${i.price * i.qty} DH</td>` +
        `</tr>`
    )
    .join("");
  const inner =
    `<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#ffffff">Confirmation de commande #${order.id}</h1>` +
    `<div style="margin:0 0 16px;color:#a0a0a0;font-size:14px">Merci pour votre achat. Voici le récapitulatif.</div>` +
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #2a2a2a;border-radius:8px;overflow:hidden">` +
    `<thead><tr>` +
    `<th align="left" style="padding:10px 12px;background-color:#1a1a1a;color:${accent};font-size:12px;text-transform:uppercase">Article</th>` +
    `<th align="center" style="padding:10px 12px;background-color:#1a1a1a;color:${accent};font-size:12px;text-transform:uppercase">Qté</th>` +
    `<th align="right" style="padding:10px 12px;background-color:#1a1a1a;color:${accent};font-size:12px;text-transform:uppercase">Prix</th>` +
    `<th align="right" style="padding:10px 12px;background-color:#1a1a1a;color:${accent};font-size:12px;text-transform:uppercase">Total</th>` +
    `</tr></thead>` +
    `<tbody>${rows}</tbody>` +
    `</table>` +
    `<div style="margin-top:16px;display:flex;gap:16px;flex-wrap:wrap">` +
    `<div style="flex:1 1 280px"><div style="color:#a0a0a0;font-size:12px">Adresse</div><div style="font-size:14px;color:#ffffff">${escapeHtml(order.address)}</div></div>` +
    `<div style="flex:1 1 180px"><div style="color:#a0a0a0;font-size:12px">Téléphone</div><div style="font-size:14px;color:#ffffff">${escapeHtml(order.phone)}</div></div>` +
    `</div>` +
    `<div style="margin-top:20px;padding:12px;border:1px solid #2a2a2a;border-radius:8px;background-color:#0f0f0f">` +
    `<div style="display:flex;justify-content:space-between;align-items:center;color:#ffffff"><span style="color:#a0a0a0">Total</span><span style="font-weight:700;color:${accent}">${order.total} DH</span></div>` +
    `</div>` +
    `<div style="margin-top:20px"><a href="${env.APP_URL}" style="display:inline-block;background-color:${accent};color:#000000;font-weight:700;padding:10px 16px;border-radius:999px;text-decoration:none">Visiter le site</a></div>`;
  const html = baseTemplate(`Commande #${order.id}`, inner);
  return { html, attachments: getLogoAttachment() };
}

export async function sendEmail(to: string, subject: string, html: string, options?: MailOptions) {
  const hasSmtp = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
  let transporter: any;
  const mail = {
    from: env.MAIL_FROM,
    to,
    subject,
    html,
    attachments: options?.attachments,
    replyTo: options?.replyTo,
  };
  if (hasSmtp) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST as string,
      port: env.SMTP_PORT || 587,
      secure: false,
      auth: { user: env.SMTP_USER as string, pass: env.SMTP_PASS as string },
    });
    try {
      const info = await transporter.sendMail(mail);
      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      return { messageId: info.messageId, previewUrl };
    } catch {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      const info = await transporter.sendMail(mail);
      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      return { messageId: info.messageId, previewUrl };
    }
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    const info = await transporter.sendMail(mail);
    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    return { messageId: info.messageId, previewUrl };
  }
}
