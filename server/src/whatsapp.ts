import { env } from "./env";

export async function sendWhatsApp(body: string) {
  if (env.WHATSAPP_PROVIDER !== "twilio") {
    return { ok: true };
  }
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_WHATSAPP_FROM || !env.OWNER_WHATSAPP) {
    return { ok: false, error: "missing_twilio_env" };
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const form = new URLSearchParams();
  form.append("From", env.TWILIO_WHATSAPP_FROM);
  form.append("To", env.OWNER_WHATSAPP);
  form.append("Body", body);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  if (!res.ok) {
    const txt = await res.text();
    return { ok: false, error: txt };
  }
  return { ok: true };
}
