const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Conversation = sequelize.define(
    'Conversation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      channel: {
        type: DataTypes.ENUM('whatsapp', 'instagram', 'facebook'),
        allowNull: false,
      },
      state: {
        type: DataTypes.ENUM('BOT_ACTIVE', 'HUMAN_TAKEOVER', 'RESOLVED', 'CLOSED'),
        defaultValue: 'BOT_ACTIVE',
      },
      assignedTo: { type: DataTypes.STRING, allowNull: true },
      closedAt: { type: DataTypes.DATE, allowNull: true },
      metadata: { type: DataTypes.JSONB, defaultValue: {} },
    },
    { tableName: 'conversations' }
  );

  Conversation.associate = (models) => {
    Conversation.belongsTo(models.User, { foreignKey: 'userId' });
    Conversation.hasMany(models.Message, { foreignKey: 'conversationId' });
    Conversation.hasMany(models.FollowUpJob, { foreignKey: 'conversationId' });
    Conversation.hasMany(models.Order, { foreignKey: 'conversationId' });
  };

  return Conversation;
};
