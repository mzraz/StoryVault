const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bookchapters', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
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
    chaptersequenceNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'bookchapters',
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
        name: "chapter_bookChapters_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "chapterId" },
        ]
      },
      {
        name: "book_bookChapters_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "bookId" },
        ]
      },
    ]
  });
};
