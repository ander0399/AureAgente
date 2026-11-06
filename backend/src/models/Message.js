const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Message = sequelize.define(
    'Message',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      conversationId: { type: DataTypes.UUID, allowNull: false },
      direction: {
        type: DataTypes.ENUM('inbound', 'outbound'),
        allowNull: false,
      },
      content: { type: DataTypes.TEXT, allowNull: false },
      messageType: {
        type: DataTypes.ENUM('text', 'image', 'template', 'interactive', 'audio', 'video'),
        defaultValue: 'text',
      },
      metaMessageId: { type: DataTypes.STRING, allowNull: true, unique: true },
      sentAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      metadata: { type: DataTypes.JSONB, defaultValue: {} },
    },
    { tableName: 'messages' }
  );

  Message.associate = (models) => {
    Message.belongsTo(models.Conversation, { foreignKey: 'conversationId' });
  };

  return Message;
};
