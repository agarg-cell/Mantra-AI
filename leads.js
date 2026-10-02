// Lead capture endpoint — receives email + conversation from Maya chat widget
// Notifies Ankur at ankur824@gmail.com via Resend (free: resend.com)
// Add RESEND_API_KEY to Vercel env vars (Settings → Environment Variables)

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const { email, source = 'Website', conversation = '', name = '' } = req.body;

  if (!email) return res.status(400).json({ error: 'Email required' });

  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

  // Log to console (visible in Vercel logs)
  console.log(`[Mantra AI Lead] ${timestamp} | ${email} | Source: ${source}`);

  // Send email notification via Resend if API key is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Mantra AI <leads@mantraai.ai>',
          to: ['agarg@mantraai.ai'],
          subject: `🔥 New Lead: ${email} — ${source}`,
          html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0B1825;color:#F0F6FF;padding:24px;border-radius:12px">
  <div style="background:linear-gradient(135deg,#2DD4C8,#1565C0);padding:3px;border-radius:10px;margin-bottom:20px">
    <div style="background:#0B1825;border-radius:8px;padding:16px;text-align:center">
      <div style="font-size:22px;font-weight:800;letter-spacing:2px;color:#2DD4C8">MANTRA AI</div>
      <div style="font-size:11px;color:#4A6580;margin-top:2px">Patient Flywheel System</div>
    </div>
  </div>
  <h2 style="color:#2DD4C8;margin:0 0 16px">🔥 New Lead Captured</h2>
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:8px 0;color:#4A6580;font-size:12px;width:100px">Email</td><td style="padding:8px 0;font-weight:600"><a href="mailto:${email}" style="color:#2DD4C8">${email}</a></td></tr>
    ${name ? `<tr><td style="padding:8px 0;color:#4A6580;font-size:12px">Name</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>` : ''}
    <tr><td style="padding:8px 0;color:#4A6580;font-size:12px">Source</td><td style="padding:8px 0">${source}</td></tr>
    <tr><td style="padding:8px 0;color:#4A6580;font-size:12px">Time</td><td style="padding:8px 0">${timestamp} ET</td></tr>
  </table>
  ${conversation ? `
  <div style="margin-top:20px;background:#0F2035;border-radius:8px;padding:16px">
    <div style="font-size:11px;color:#4A6580;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px">Conversation</div>
    <pre style="font-size:12px;color:#F0F6FF;white-space:pre-wrap;margin:0;font-family:monospace;line-height:1.6">${conversation.slice(0, 2000)}</pre>
  </div>` : ''}
  <div style="margin-top:20px;text-align:center">
    <a href="https://calendly.com/ankur824/30min" style="display:inline-block;background:linear-gradient(135deg,#2DD4C8,#1565C0);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700;font-size:13px">📅 Book Follow-Up Call</a>
  </div>
</div>`,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        console.error('Resend error:', errText);
      }
    } catch (err) {
      console.error('Email send error:', err);
    }
  }

  return res.status(200).json({ success: true, message: 'Lead captured' });
}
