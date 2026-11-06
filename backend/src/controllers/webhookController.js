const { processMetaEvent } = require('../services/agentDecision');

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Webhook] Verificado por Meta');
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Forbidden');
}

async function receiveWebhook(req, res) {
  // Responder 200 inmediatamente para evitar reintentos de Meta
  res.status(200).send('EVENT_RECEIVED');

  const body = req.body;
  const validObjects = ['whatsapp_business_account', 'instagram', 'page'];
  if (!validObjects.includes(body.object)) return;

  const entries = body.entry || [];
  for (const entry of entries) {
    for (const change of entry.changes || []) {
      try {
        if (change.field === 'messages') {
          await handleWhatsAppMessages(change.value);
        } else if (change.field === 'comments') {
          await handleInstagramComments(change.value);
        } else if (change.field === 'feed') {
          await handleFacebookFeed(change.value);
        }
      } catch (err) {
        console.error('[Webhook] Error procesando change:', err.message);
      }
    }
  }
}

async function handleWhatsAppMessages(value) {
  const messages = value.messages || [];
  const contacts = value.contacts || [];
  const metadata = value.metadata || {};

  for (const msg of messages) {
    if (msg.type !== 'text') continue;

    const contact = contacts.find((c) => c.wa_id === msg.from);
    await processMetaEvent({
      channel: 'whatsapp',
      channelUserId: msg.from,
      userName: contact?.profile?.name || 'Cliente',
      messageId: msg.id,
      text: msg.text?.body || '',
      phoneNumberId: metadata.phone_number_id,
      timestamp: msg.timestamp,
    });
  }
}

async function handleInstagramComments(value) {
  if (!value.from || !value.text) return;

  await processMetaEvent({
    channel: 'instagram',
    channelUserId: value.from.id,
    userName: value.from.name || 'Usuario IG',
    messageId: value.id,
    text: value.text,
    commentOnPostId: value.media?.id,
    type: 'comment',
  });
}

async function handleFacebookFeed(value) {
  if (value.item !== 'comment' || !value.message) return;

  await processMetaEvent({
    channel: 'facebook',
    channelUserId: value.sender_id,
    userName: 'Usuario FB',
    messageId: value.comment_id,
    text: value.message,
    postId: value.post_id,
    type: 'comment',
  });
}

module.exports = { verifyWebhook, receiveWebhook };
