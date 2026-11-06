const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FollowUpJob = sequelize.define(
    'FollowUpJob',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      conversationId: { type: DataTypes.UUID, allowNull: true },
      jobType: {
        type: DataTypes.ENUM('cart_recovery', 'reengagement_7', 'reengagement_30'),
        allowNull: false,
      },
      scheduledAt: { type: DataTypes.DATE, allowNull: false },
      sentAt: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'sent', 'cancelled', 'failed'),
        defaultValue: 'pending',
      },
      metadata: { type: DataTypes.JSONB, defaultValue: {} },
    },
    { tableName: 'follow_up_jobs' }
  );

  FollowUpJob.associate = (models) => {
    FollowUpJob.belongsTo(models.User, { foreignKey: 'userId' });
    FollowUpJob.belongsTo(models.Conversation, { foreignKey: 'conversationId' });
  };

  return FollowUpJob;
};
