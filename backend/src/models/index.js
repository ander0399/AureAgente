const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(config.url, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

const models = {
  User: require('./User')(sequelize),
  Conversation: require('./Conversation')(sequelize),
  Message: require('./Message')(sequelize),
  Product: require('./Product')(sequelize),
  Order: require('./Order')(sequelize),
  FollowUpJob: require('./FollowUpJob')(sequelize),
};

Object.values(models).forEach((model) => {
  if (model.associate) model.associate(models);
});

module.exports = { sequelize, ...models };
