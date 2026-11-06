const express = require('express');
const router = express.Router();
const { Conversation, User, Message } = require('../models');
const { Op } = require('sequelize');

router.get('/', async (req, res) => {
  try {
    const conversations = await Conversation.findAll({
      where: { state: { [Op.in]: ['BOT_ACTIVE', 'HUMAN_TAKEOVER'] } },
      include: [
        { model: User, attributes: ['id', 'name', 'phone', 'channel', 'channelUserId'] },
        { model: Message, limit: 1, order: [['sentAt', 'DESC']] },
      ],
      order: [['updatedAt', 'DESC']],
    });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/messages', async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { conversationId: req.params.id },
      order: [['sentAt', 'ASC']],
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/state', async (req, res) => {
  const { state } = req.body;
  const validStates = ['BOT_ACTIVE', 'HUMAN_TAKEOVER', 'RESOLVED', 'CLOSED'];
  if (!validStates.includes(state)) return res.status(400).json({ error: 'Estado inválido' });

  try {
    const conv = await Conversation.findByPk(req.params.id, { include: [User] });
    if (!conv) return res.status(404).json({ error: 'No encontrada' });

    await conv.update({ state });
    await conv.User?.update({ conversationState: state });

    const io = req.app.get('io');
    io?.emit('conversation:update', conv);

    res.json({ ok: true, state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
