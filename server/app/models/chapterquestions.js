const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('chapterquestions', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    chapterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'chapters',
        key: 'chapterId'
      }
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'questions',
        key: 'questionId'
      }
    },
    answer: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    questionSequenceNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    bookChaptersId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bookchapters',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'chapterquestions',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "chapter_chapterQuestions_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "chapterId" },
        ]
      },
      {
        name: "question_chapterQuestions_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "questionId" },
        ]
      },
      {
        name: "bookChapters_id_idx1",
        using: "BTREE",
        fields: [
          { name: "bookChaptersId" },
        ]
      },
    ]
  });
};