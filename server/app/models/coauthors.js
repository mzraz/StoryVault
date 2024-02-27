const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('coauthors', {
    coAuthorId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    bookId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'books',
        key: 'bookId'
      }
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
    isAnswered: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'coauthors',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "coAuthorId" },
        ]
      },
      {
        name: "book_coauthors_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "bookId" },
        ]
      },
      {
        name: "chapter_coauthors_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "chapterId" },
        ]
      },
      {
        name: "question_coauthors_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "questionId" },
        ]
      },
      {
        name: "user_coauthors_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "userId" },
        ]
      },
    ]
  });
};