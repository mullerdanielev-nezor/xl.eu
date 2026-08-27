const nodemailer = require('nodemailer');

const TO_ADDRESS = 'info@xl-lemeztechnika.eu';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { source, name, company, email, phone, country, service, message } = req.body || {};

  if (!name || !email || !phone) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.migadu.com',
    port: 587,
    secure: false,
    auth: {
      user: 'info@xl-lemeztechnika.eu',
      pass: process.env.MIGADU_PASSWORD,
    },
  });

  const lines = [
    `Form: ${source || 'unknown'}`,
    `Name: ${name}`,
    company ? `Company: ${company}` : null,
    `Email: ${email}`,
    `Phone: ${phone}`,
    country ? `Country: ${country}` : null,
    service ? `Service: ${service}` : null,
    '',
    message || '(no message)',
  ].filter(Boolean);

  try {
    await transporter.sendMail({
      from: 'info@xl-lemeztechnika.eu',
      to: TO_ADDRESS,
      replyTo: email,
      subject: `New quote request from ${name}`,
      text: lines.join('\n'),
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('contact form send failed', err);
    res.status(500).json({ error: 'Send failed' });
  }
};
