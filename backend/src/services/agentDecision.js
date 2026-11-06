const { Op } = require('sequelize');
const { User, Conversation, Message } = require('../models');
const { sendWhatsAppMessage, sendInstagramDM, sendCommentReply } = require('./metaApi');
const { callLLM } = require('./llmService');
const { scheduleFollowUp, cancelPendingFollowUps } = require('../queues/followUpQueue');
const { getIo } = require('../socket');

const HUMAN_TRIGGER_PATTERNS = [
  /hablar con (una? )?(persona|asesor|vendedor|humano)/i,
  /quiero que me atienda/i,
  /asesor humano/i,
  /agente humano/i,
  /(me comunica|comunícame) con/i,
  /prefiero hablar con alguien/i,
];

async function processMetaEvent(event) {
  try {
    const user = await findOrCreateUser(event);
    const conversation = await findOrCreateConversation(user, event);

    if (conversation.state === 'HUMAN_TAKEOVER') return;

    await Message.create({
      conversationId: conversation.id,
      direction: 'inbound',
      content: event.text,
      messageType: 'text',
      metaMessageId: event.messageId,
    });

    await user.update({ lastInteraction: new Date() });
    await cancelPendingFollowUps(user.id, 'cart_recovery');

    if (HUMAN_TRIGGER_PATTERNS.some((p) => p.test(event.text))) {
      await triggerHumanTakeover(user, conversation, event);
      return;
    }

    const history = await Message.findAll({
      where: { conversationId: conversation.id },
      order: [['sentAt', 'DESC']],
      limit: 12,
    });

    const chatHistory = history
      .reverse()
      .map((m) => ({ role: m.direction === 'inbound' ? 'user' : 'assistant', content: m.content }));

    const response = await callLLM(chatHistory);
    if (!response) return;

    if (response.humanTakeover) {
      await triggerHumanTakeover(user, conversation, event);
      return;
    }

    await sendReply(event, response.text);

    await Message.create({
      conversationId: conversation.id,
      direction: 'outbound',
      content: response.text,
      messageType: 'text',
    });

    await scheduleFollowUp({
      userId: user.id,
      conversationId: conversation.id,
      jobType: 'cart_recovery',
      delayMs: 3 * 60 * 60 * 1000,
      metadata: { channel: event.channel, lastText: event.text.substring(0, 100) },
    });

    // Notificar al dashboard en tiempo real
    getIo()?.emit('conversation:update', { ...conversation.toJSON(), User: user.toJSON() });
  } catch (err) {
    console.error('[AgentDecision] Error:', err.message);
  }
}

async function findOrCreateUser(event) {
  const [user] = await User.findOrCreate({
    where: { channel: event.channel, channelUserId: event.channelUserId },
    defaults: {
      name: event.userName,
      phone: event.channel === 'whatsapp' ? event.channelUserId : null,
      channel: event.channel,
      channelUserId: event.channelUserId,
      lastInteraction: new Date(),
    },
  });
  return user;
}

async function findOrCreateConversation(user, event) {
  let conversation = await Conversation.findOne({
    where: {
      userId: user.id,
      state: { [Op.in]: ['BOT_ACTIVE', 'HUMAN_TAKEOVER'] },
    },
    order: [['createdAt', 'DESC']],
  });

  if (!conversation) {
    conversation = await Conversation.create({
      userId: user.id,
      channel: event.channel,
      state: 'BOT_ACTIVE',
    });
  }

  return conversation;
}

async function triggerHumanTakeover(user, conversation, event) {
  await Promise.all([
    conversation.update({ state: 'HUMAN_TAKEOVER' }),
    user.update({ conversationState: 'HUMAN_TAKEOVER' }),
  ]);

  const msg =
    '¡Perfecto! 😊 En un momento un asesor personal de AURE te va a atender. Gracias por tu paciencia.';
  await sendReply(event, msg);

  await Message.create({
    conversationId: conversation.id,
    direction: 'outbound',
    content: msg,
    messageType: 'text',
  });

  // Notificar al dashboard
  getIo()?.emit('conversation:update', { ...conversation.toJSON(), state: 'HUMAN_TAKEOVER', User: user.toJSON() });
  getIo()?.emit('alert:human_takeover', { userId: user.id, name: user.name, channel: event.channel, conversationId: conversation.id });

  console.log(`[HUMAN_TAKEOVER] ${event.channel}:${event.channelUserId} — conversación ${conversation.id}`);
}

async function sendReply(event, text) {
  if (event.channel === 'whatsapp') {
    await sendWhatsAppMessage(event.channelUserId, text, event.phoneNumberId);
  } else if (event.channel === 'instagram') {
    if (event.type === 'comment') {
      await sendCommentReply(event.messageId, text);
    }
    await sendInstagramDM(event.channelUserId, text);
  } else if (event.channel === 'facebook') {
    if (event.type === 'comment') {
      await sendCommentReply(event.messageId, text);
    }
    await sendInstagramDM(event.channelUserId, text);
  }
}

module.exports = { processMetaEvent };
