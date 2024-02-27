const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('invitation', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    senderUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'userId'
      }
    },
    recieverEmail: {
      type: DataTypes.STRING(255),
      allowNull: false
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
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'invitation',
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
        name: "user_invitation_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "senderUserId" },
        ]
      },
      {
        name: "book_invitation_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "bookId" },
        ]
      },
      {
        name: "chapter_invitation_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "chapterId" },
        ]
      },
      {
        name: "question_invitation_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "questionId" },
        ]
      },
    ]
  });
};