const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('promotion_voucher', {
    promo_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    promo_code: {
      type: DataTypes.STRING(40),
      allowNull: false
    },
    promo_value: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    valid_from: {
      type: DataTypes.DATE,
      allowNull: false
    },
    valid_till: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'promotion_voucher',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "promo_id" },
        ]
      },
    ]
  });
};
