const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: true },
      phone: { type: DataTypes.STRING, allowNull: true },
      email: { type: DataTypes.STRING, allowNull: true },
      channel: {
        type: DataTypes.ENUM('whatsapp', 'instagram', 'facebook'),
        allowNull: false,
      },
      channelUserId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      conversationState: {
        type: DataTypes.ENUM('BOT_ACTIVE', 'HUMAN_TAKEOVER', 'RESOLVED', 'CLOSED'),
        defaultValue: 'BOT_ACTIVE',
      },
      lastInteraction: { type: DataTypes.DATE, allowNull: true },
      totalOrders: { type: DataTypes.INTEGER, defaultValue: 0 },
      metadata: { type: DataTypes.JSONB, defaultValue: {} },
    },
    {
      tableName: 'users',
      indexes: [{ unique: true, fields: ['channel', 'channelUserId'] }],
    }
  );

  User.associate = (models) => {
    User.hasMany(models.Conversation, { foreignKey: 'userId' });
    User.hasMany(models.Order, { foreignKey: 'userId' });
    User.hasMany(models.FollowUpJob, { foreignKey: 'userId' });
  };

  return User;
};
