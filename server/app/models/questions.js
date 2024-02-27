const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('questions', {
    questionId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    questionDesc: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    chapterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chapters',
        key: 'chapterId'
      }
    },
    IsCustom: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
  }, {
    sequelize,
    tableName: 'questions',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "questionId" },
        ]
      },
      {
        name: "chapter_question_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "chapterId" },
        ]
      },
    ]
  });
};
