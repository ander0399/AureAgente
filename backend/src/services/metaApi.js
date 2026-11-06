const axios = require('axios');

const BASE_URL = 'https://graph.facebook.com/v21.0';

function headers() {
  return { Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}` };
}

async function sendWhatsAppMessage(to, text, phoneNumberId) {
  const id = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  await axios.post(
    `${BASE_URL}/${id}/messages`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text, preview_url: false },
    },
    { headers: headers() }
  );
}

async function sendWhatsAppTemplate(to, phoneNumberId, templateName, languageCode = 'es', components = []) {
  const id = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  await axios.post(
    `${BASE_URL}/${id}/messages`,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: { name: templateName, language: { code: languageCode }, components },
    },
    { headers: headers() }
  );
}

async function sendInstagramDM(recipientId, text) {
  const pageId = process.env.INSTAGRAM_PAGE_ID;
  await axios.post(
    `${BASE_URL}/${pageId}/messages`,
    {
      recipient: { id: recipientId },
      message: { text },
      messaging_type: 'RESPONSE',
    },
    { headers: headers() }
  );
}

async function sendCommentReply(commentId, text) {
  await axios.post(
    `${BASE_URL}/${commentId}/replies`,
    { message: text },
    { headers: headers() }
  );
}

module.exports = {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
  sendInstagramDM,
  sendCommentReply,
};
