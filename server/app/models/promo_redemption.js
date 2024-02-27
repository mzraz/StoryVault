const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('promo_redemption', {
    promo_redemption_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    promo_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'promotion_voucher',
        key: 'promo_id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      }
    }
  }, {
    sequelize,
    tableName: 'promo_redemption',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "promo_redemption_id" },
        ]
      },
      {
        name: "promoVoucher_promoRedemption_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "promo_id" },
        ]
      },
      {
        name: "user_promoRedemption_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
