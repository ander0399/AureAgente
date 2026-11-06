const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      category: {
        type: DataTypes.ENUM('cadena', 'pulsera', 'dije', 'combo'),
        allowNull: false,
      },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      stock: { type: DataTypes.INTEGER, defaultValue: 0 },
      imageUrl: { type: DataTypes.STRING, allowNull: true },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
      metadata: { type: DataTypes.JSONB, defaultValue: {} },
    },
    { tableName: 'products' }
  );

  return Product;
};
