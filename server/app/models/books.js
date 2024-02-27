const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('books', {
    bookId: {
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
    bookType: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    author: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    image: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    frontCover: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    lastUpdatedDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false
    },
    header_text: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    page_count: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    book_color: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    template_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cover_template_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    printed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    title_color: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    author_color: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    subtitle_color: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    dedication_color: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    spine_color: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    font: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    title_fontSize: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    author_fontSize: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    subtitle_fontSize: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    bookTitle_top: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    subtitle_top: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    bookTitle_left: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    subtitle_left: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
  }, {
    sequelize,
    tableName: 'books',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "bookId" },
        ]
      },
      {
        name: "user_book_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "userId" },
        ]
      },
      // {
      //   name: "in_bookTitle", 
      //   using: "BTREE",
      //   fields: [
      //     { name: "title" }, 
      //   ]
      // }

    ]
  });
};