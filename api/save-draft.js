const MailComposer = require('nodemailer/lib/mail-composer');
const { ImapFlow } = require('imapflow');

const FROM_ADDRESS = 'info@xl-lemeztechnika.eu';
const DRAFTS_MAILBOX = 'Drafts';

function buildRawMessage({ to, subject, body }) {
  return new Promise((resolve, reject) => {
    const mail = new MailComposer({
      from: FROM_ADDRESS,
      to,
      subject,
      text: body,
    });
    mail.compile().build((err, message) => {
      if (err) return reject(err);
      resolve(message);
    });
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secret = req.headers['x-draft-secret'];
  if (!secret || secret !== process.env.DRAFT_API_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { to, subject, body } = req.body || {};
  if (!to || !subject || !body) {
    res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    return;
  }

  const client = new ImapFlow({
    host: 'imap.migadu.com',
    port: 993,
    secure: true,
    auth: {
      user: FROM_ADDRESS,
      pass: process.env.MIGADU_PASSWORD,
    },
    logger: false,
  });

  try {
    const raw = await buildRawMessage({ to, subject, body });
    await client.connect();
    await client.append(DRAFTS_MAILBOX, raw, ['\\Draft']);
    await client.logout();
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('save-draft failed', err);
    try {
      await client.logout();
    } catch (_) {}
    res.status(500).json({ error: 'Save draft failed' });
  }
};
