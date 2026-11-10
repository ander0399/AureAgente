const { Worker } = require('bullmq');
const { User, FollowUpJob } = require('../models');
const { sendWhatsAppMessage } = require('../services/metaApi');

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  ...(process.env.NODE_ENV === 'production' && { tls: {} }),
};

const worker = new Worker(
  'aure-followUp',
  async (job) => {
    const { userId, conversationId, jobType, metadata } = job.data;

    const user = await User.findByPk(userId);
    if (!user || user.channel !== 'whatsapp') return;
    if (user.conversationState === 'HUMAN_TAKEOVER') return;

    let sent = false;

    if (jobType === 'cart_recovery') {
      await sendWhatsAppMessage(
        user.channelUserId,
        `¡Hola ${user.name || 'amor'}! 💛 Vi que estuviste mirando nuestras joyas en AURE. Tenemos disponibilidad limitada esta semana y envío gratis hoy. ¿Te ayudo a encontrar la pieza perfecta? ✨`,
        process.env.WHATSAPP_PHONE_NUMBER_ID
      );
      sent = true;
    } else if (jobType === 'reengagement_7') {
      await sendWhatsAppMessage(
        user.channelUserId,
        `¡Hola ${user.name || 'amor'}! 💛 Esperamos que tu joya de AURE esté brillando tanto como tú. ¿Cómo te quedó? Recuerda que tienes 5 años de garantía con nosotros. 🌟`,
        process.env.WHATSAPP_PHONE_NUMBER_ID
      );
      sent = true;
    } else if (jobType === 'reengagement_30') {
      await sendWhatsAppMessage(
        user.channelUserId,
        `¡${user.name || 'Hola'}, ya es momento de renovar tu look! ✨ Nuevas cadenas, pulseras y combos llegaron a AURE esta semana. ¿Te muestro el catálogo? 💎`,
        process.env.WHATSAPP_PHONE_NUMBER_ID
      );
      sent = true;
    }

    if (sent) {
      await FollowUpJob.create({
        userId,
        conversationId,
        jobType,
        scheduledAt: new Date(Date.now() - (job.opts.delay || 0)),
        sentAt: new Date(),
        status: 'sent',
        metadata,
      });
    }
  },
  { connection: redisConnection, concurrency: 5 }
);

worker.on('failed', (job, err) => {
  console.error(`[FollowUpWorker] Job ${job?.id} falló:`, err.message);
});

worker.on('completed', (job) => {
  console.log(`[FollowUpWorker] Job ${job.id} completado`);
});

module.exports = worker;
