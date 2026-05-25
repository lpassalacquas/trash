import Stripe from "stripe";
import nodemailer from "nodemailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendSMS(text) {
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "3058770025@txt.att.net",
      subject: "",
      text,
    });
  } catch (e) {
    console.error("SMS failed:", e.message);
  }
}

async function sheetsPost(data) {
  const res = await fetch(process.env.GOOGLE_SHEETS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { success: false, error: text }; }
}

async function sheetsGet() {
  const res = await fetch(process.env.GOOGLE_SHEETS_URL);
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { success: false, error: text }; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action } = req.body;

  if (action === "get_jobs") {
    const data = await sheetsGet();
    return res.status(200).json(data);
  }

  if (action === "create_job") {
    const { job } = req.body;
    const data = await sheetsPost({
      action: "create",
      id: job.id,
      name: job.name,
      address: job.address,
      bags: job.bags,
      date: job.date,
      notes: job.notes || "",
      total: job.total,
      status: job.status,
      paymentMethod: job.paymentMethod,
      paymentMethodId: job.paymentMethodId || "",
      createdAt: job.createdAt,
    });
    return res.status(200).json(data);
  }

  if (action === "update_job") {
    const { id, updates } = req.body;
    const data = await sheetsPost({ action: "update", id, ...updates });
    return res.status(200).json(data);
  }

  if (action === "delete_job") {
    const { id } = req.body;
    const data = await sheetsPost({ action: "delete", id });
    return res.status(200).json(data);
  }

  if (action === "notify") {
    const { type, customerName, apt, bags, date, total, jobId } = req.body;
    if (type === "new_booking") {
      await sendSMS(`New BagRun booking!\nName: ${customerName}\nApt: ${apt}\nBags: ${bags}\nDate: ${date}\nTotal: $${total}\nJob ID: ${jobId}`);
    }
    if (type === "job_complete") {
      await sendSMS(`Job complete!\nName: ${customerName}\nApt: ${apt}\nBags: ${bags}\nJob ID: ${jobId}`);
    }
    return res.status(200).json({ success: true });
  }

  if (action === "charge_and_complete") {
    const { paymentMethodId, amount, jobId, customerName, apt, bags, total } = req.body;
    await sendSMS(`Job complete!\nName: ${customerName}\nApt: ${apt}\nBags: ${bags}\nJob ID: ${jobId}\nCharging card...`);
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        payment_method: paymentMethodId,
        confirm: true,
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
        description: `BagRun · ${jobId} · ${customerName}`,
      });
      await sendSMS(`Payment received!\nName: ${customerName}\nApt: ${apt}\nAmount: $${total}\nJob ID: ${jobId}`);
      return res.status(200).json({ success: true, paymentIntentId: paymentIntent.id });
    } catch (err) {
      return res.status(200).json({ success: false, error: err.message });
    }
  }

  return res.status(200).json({ success: false, error: "Unknown action" });
}
