const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Order = sequelize.define(
    'Order',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      conversationId: { type: DataTypes.UUID, allowNull: true },
      items: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'),
        defaultValue: 'pending',
      },
      paymentMethod: { type: DataTypes.STRING, allowNull: true },
      shippingAddress: { type: DataTypes.JSONB, allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'orders' }
  );

  Order.associate = (models) => {
    Order.belongsTo(models.User, { foreignKey: 'userId' });
    Order.belongsTo(models.Conversation, { foreignKey: 'conversationId' });
  };

  return Order;
};
