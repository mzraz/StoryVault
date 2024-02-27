const db = require("../models");
const Book = db.books;
const User = db.users;
const Voucher = db.voucher;
const invitation = db.invitation;
const Promotion = db.promotion_voucher;
const Redemption = db.promo_redemption;
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const AWS = require("aws-sdk");
const multer = require("multer");
const fs = require("fs");
const puppeteer = require("puppeteer");
const Joi = require("joi");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const PDFJS = require("pdfjs-dist");
const { successResponse, errorResponse } = require("../common/response");
const printBook = db.printbook;
const sharp = require("sharp");
const path = require("path");
// Create a new Book
const bookValidation = Joi.object({
  title: Joi.string().required(),
  image: Joi.string().required(),
  frontCover: Joi.string().allow("", null),
  author: Joi.string().allow("", null),
  bookType: Joi.string().required(),
  awsUserId: Joi.string().required(),
  startDate: Joi.date(),
  lastUpdatedDate: Joi.date(),
  deadline: Joi.date(),
  header_text: Joi.string().allow("", null),
  book_color: Joi.string().allow("", null),
  description: Joi.string().allow("", null),
  template_id: Joi.number(),
  cover_template_id: Joi.number(),
  title_color: Joi.string().allow("", null),
  author_color: Joi.string().allow("", null),
  subtitle_color: Joi.string().allow("", null),
  dedication_color: Joi.string().allow("", null),
  spine_color: Joi.string().allow("", null),
  font: Joi.string().allow("", null),
  title_fontSize: Joi.string().allow("", null),
  author_fontSize: Joi.string().allow("", null),
  subtitle_fontSize: Joi.string().allow("", null),
  bookTitle_top: Joi.string().allow(null),
  subtitle_top: Joi.string().allow(null),
  bookTitle_left: Joi.string().allow(null),
  subtitle_left: Joi.string().allow(null),
});

exports.createBook = async (req, res) => {
  const { error } = bookValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    let book = {};
    if (req.body.title != "") {
      const users = await User.findOne({
        where: {
          awsUserId: req.body.awsUserId,
        },
      });
      const userId = users?.userId;

      const existingBook = await Book.findOne({
        where: {
          userId: userId,
          title: req.body.title,
        },
      });
      if (existingBook) {
        return res.status(400).json({ message: "Title already exists" });
      }

      book = {
        title: req.body.title,
        image: req.body.image,
        frontCover: req.body.frontCover,
        author: req.body.author,
        bookType: req.body.bookType,
        userId: userId,
        startDate: req.body.startDate,
        lastUpdatedDate: req.body.lastUpdatedDate,
        deadline: req.body.deadline,
        header_text: req.body.header_text,
        book_color: req.body.book_color,
        page_count: 0,
        description: req.body.description,
        template_id: req.body.template_id,
        cover_template_id: req.body.cover_template_id,
        title_color: req.body.title_color,
        author_color: req.body.author_color,
        subtitle_color: req.body.subtitle_color,
        dedication_color: req.body.dedication_color,
        spine_color: req.body.spine_color,
        font: req.body.font,
        title_fontSize: req.body.title_fontSize,
        subtitle_fontSize: req.body.subtitle_fontSize,
        author_fontSize: req.body.author_fontSize,
        bookTitle_top: req.body.bookTitle_top,
        subtitle_top: req.body.subtitle_top,
        bookTitle_left: req.body.bookTitle_left,
        subtitle_left: req.body.subtitle_left,
      };
      const bookCreated = await Book.create(book);
      res.status(200).json({
        status: true,
        data: successResponse(bookCreated),
      });
    } else {
      res.status(400).json({
        status: false,
        message: "Book name should not be empty",
      });
    }
  } catch (err) {
    res.status(500).json({
      status: false,
      message: errorResponse(err.message),
    });
  }
};

exports.updateBook = async (req, res) => {
  try {
    let book = {};
    const isExists = await Book.findOne({
      where: { bookId: req.body.bookId },
    });
    if (req.body.title != "" && isExists) {
      const users = await User.findOne({
        where: {
          awsUserId: req.body.awsUserId,
        },
      });

      const existingBook = await Book.findOne({
        where: {
          userId: users.userId,
          title: req.body.title,
          bookId: {
            [Op.ne]: req.body.bookId,
          },
        },
      });
      if (existingBook) {
        return res.status(400).json({ message: "Title already exists" });
      }

      book = {
        title: req.body.title,
        image: req.body.image,
        frontCover: req.body.frontCover,
        author: req.body.author,
        bookType: req.body.bookType,
        userId: users.userId,
        startDate: req.body.startDate,
        lastUpdatedDate: req.body.lastUpdatedDate,
        deadline: req.body.deadline,
        header_text: req.body.header_text,
        book_color: req.body.book_color,
        description: req.body.description,
        template_id: req.body.template_id,
        cover_template_id: req.body.cover_template_id,
        title_color: req.body.title_color,
        author_color: req.body.author_color,
        subtitle_color: req.body.subtitle_color,
        dedication_color: req.body.dedication_color,
        spine_color: req.body.spine_color,
        font: req.body.font,
        title_fontSize: req.body.title_fontSize,
        subtitle_fontSize: req.body.subtitle_fontSize,
        author_fontSize: req.body.author_fontSize,
        bookTitle_top: req.body.bookTitle_top,
        subtitle_top: req.body.subtitle_top,
        bookTitle_left: req.body.bookTitle_left,
        subtitle_left: req.body.subtitle_left,
      };

      const updatedBook = await Book.update(book, {
        returning: true,
        where: {
          bookId: parseInt(req.body.bookId),
        },
      });
      if (!updatedBook) {
        return res
          .status(400)
          .json({ message: "Error occurred in updating a book" });
      }

      res.status(200).json({
        status: true,
        message: "Book updated successfully",
      });
    }
  } catch (err) {
    res.status(500).json({
      status: false,
      message: errorResponse(err.message),
    });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findOne({
      where: { bookId: req.params.bookId },
    });
    if (!book) {
      return res.status(404).json({ message: "book not found" });
    }
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.getBookByUserId = async (req, res) => {
  try {
    const { awsUserId } = req.params;
    const user = await User.findOne({ where: { awsUserId } });
    const userId = user?.userId;

    const books = await Book.findAll({ where: { userId } });

    const bookIds = books.map((book) => book.bookId);
    const invitations = await invitation.findAll({
      where: { bookId: bookIds, senderUserId: userId },
    });

    const bookData = books.map((book) => {
      const matchedInvitations = invitations.filter(
        (invitation) =>
          invitation.bookId === book.bookId &&
          invitation.senderUserId === book.userId
      );
      const recieverEmails = matchedInvitations.map(
        (invitation) => invitation.recieverEmail
      );

      return {
        bookId: book.bookId,
        userId: book.userId,
        bookType: book.bookType,
        title: book.title,
        author: book.author,
        image: book.image,
        frontCover: book.frontCover,
        startDate: book.startDate,
        lastUpdatedDate: book.lastUpdatedDate,
        deadline: book.deadline,
        header_text: book.header_text,
        book_color: book.book_color,
        cover_template_id: book.cover_template_id,
        coAuthors: recieverEmails.length ? recieverEmails : undefined,
        spine_color: book.spine_color,
      };
    });

    res.status(200).json({
      status: true,
      data: successResponse(bookData),
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: errorResponse(err.message),
    });
  }
};

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION1,
});

const s3 = new AWS.S3();

exports.htmlToPdf = async (req, res) => {
  const { htmlContent, bookName, subtitle, author, awsUserId } = req.body;

  const processedSubtitle = subtitle || "";
  const processedAuthor = author || "";

  try {
    // Step 1: Convert HTML to PDF and save the array of chapters
    const browser = await puppeteer.launch({
       executablePath: "/usr/bin/google-chrome",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0);
    await page.setContent(htmlContent);
    await page.emulateMediaType("screen");
    const styleContent = `
      // body {
      //   font-size: 14px !important;
      // }
      img {
        display: block;
        margin: 0 auto;
      }
    `;
    await page.addStyleTag({ content: styleContent });
    const imagesPresent = await page.evaluate(() => {
      const images = Array.from(document.getElementsByTagName("img"));
      return images.length > 0;
    });
    if (imagesPresent) {
      await page.evaluate(async () => {
        const images = Array.from(document.getElementsByTagName("img"));

        for (const image of images) {
          const naturalWidth = image.naturalWidth;
          const naturalHeight = image.naturalHeight;
          const maxWidth = 360;
          const maxHeight = 360;

          if (naturalWidth > maxWidth || naturalHeight > maxHeight) {
            const ratio = Math.min(
              maxWidth / naturalWidth,
              maxHeight / naturalHeight
            );
            image.style.maxWidth = `${naturalWidth * ratio}px`;
            image.style.maxHeight = `${naturalHeight * ratio}px`;
          }
        }
      });

      await page.evaluate(async () => {
        const paragraphs = Array.from(document.getElementsByTagName("h6"));

        for (const paragraph of paragraphs) {
          if (paragraph) {
            paragraph.style.textAlign = "center";
            paragraph.style.margin = "5px 70px 25px 70px";
            paragraph.style.font = "13px Arial, sans-serif";
            paragraph.style.lineHeight = "1.2";
          }
        }
      });
    }
    await page.pdf({
      path: `${bookName}${awsUserId}.pdf`,
      height: "9in",
      width: "6in",
      margin: {
        top: "0.3in",
        right: "0.3in",
        bottom: "0.3in",
        left: "0.3in",
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate:
        '<div style="font-size: 8px; text-align: center; width: 100%;"><span class="pageNumber"></span></div>',
             timeout: 500000
    });
    const pdfFilePath = `${bookName}${awsUserId}.pdf`;

    // Extract chapter names using H3 tags and save in array
    const chapterArray = await page.evaluate(() => {
      const h3Elements = Array.from(document.getElementsByTagName("h3"));
      return h3Elements.map((h3) => h3.innerText);
    });

    // Step 2: Upload the PDF to AWS S3
    const fileContent = fs.readFileSync(pdfFilePath);
    const s3FileContent = fileContent;

    // Step 3: Search for chapter names in the PDF and get page numbers
    const matchingChapters = [];
    const matchingChapterPages = [];

    const loadingTask = PDFJS.getDocument(new Uint8Array(s3FileContent));

    const pdf = await loadingTask.promise;
    const totalPages = pdf.numPages;
    const books = await Book.findOne({
      where: {
        title: bookName,
      },
    });

    await books.update({
      page_count: totalPages,
    });

    if (totalPages > 300) {
      return res
        .status(400)
        .json({
          message: `Your Total Pages: ${totalPages}. Please reduce your pages to 300 or below to create book`,
        });
    }
    const cleanUpChapterName = (chapterName) => chapterName.trim();
    let pageNum = 1;
    let pageagain = 1;
    for (let chapterName of chapterArray) {
      chapterName = cleanUpChapterName(chapterName);

      for (pageNum = pageagain; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        const cleanPageText = cleanUpChapterName(pageText);

        if (
          cleanPageText.includes(chapterName) &&
          textContent.items.find((item) => item.height > 12)
        ) {
          matchingChapters.push(chapterName);
          matchingChapterPages.push(pageNum);
          pageagain = pageNum;
          break;
        }
      }
    }
    // Step 4: Create a table of contents (TOC) page
    const tocPdf = await PDFDocument.create();
    const tocPageWidth = 432;
    const tocPageHeight = 648;
    const tocFont = await tocPdf.embedFont(StandardFonts.Helvetica);
    const tocFontSize = 12;
    const tocHeading = "Table of Contents";
    const tocHeadingWidth = tocFont.widthOfTextAtSize(tocHeading, tocFontSize);
    const tocHeadingX = (tocPageWidth - tocHeadingWidth) / 2;
    const tocEntryMargin = 10;

    let contentY = tocPageHeight - tocFontSize - tocEntryMargin - 20;
    let tocPage = tocPdf.addPage([tocPageWidth, tocPageHeight]);
    let tocPageIndex = 0;

    tocPage.drawText(tocHeading, {
      x: tocHeadingX,
      y: contentY,
      font: tocFont,
      size: tocFontSize,
      color: rgb(0, 0, 0),
    });
    contentY -= tocFontSize + tocEntryMargin;
    for (let i = 0; i < matchingChapters.length; i++) {
      const chapterName = matchingChapters[i];
      const pageNumber = matchingChapterPages[i];

      const chapterText = chapterName;
      const pageNumberText = `${pageNumber}`;
      const pageNumberTextWidth = tocFont.widthOfTextAtSize(
        pageNumberText,
        tocFontSize
      );

      if (contentY <= tocFontSize + tocEntryMargin) {
        tocPage = tocPdf.addPage([tocPageWidth, tocPageHeight]);
        tocPageIndex++;
        contentY = tocPageHeight - tocFontSize - tocEntryMargin - 20;
        tocPage.drawText("", {
          x: tocHeadingX,
          y: contentY,
          font: tocFont,
          size: tocFontSize,
          color: rgb(0, 0, 0),
        });
        contentY -= tocFontSize + tocEntryMargin;
      }
      const chapterTextX = 50;
      const pageNumberTextX = tocPageWidth - pageNumberTextWidth - 50;

      tocPage.drawText(chapterText, {
        x: chapterTextX,
        y: contentY,
        font: tocFont,
        size: tocFontSize - 4,
        color: rgb(0, 0, 0),
        lineHeight: tocFontSize,
        opacity: 1,
      });

      tocPage.drawText(pageNumberText, {
        x: pageNumberTextX,
        y: contentY,
        font: tocFont,
        size: tocFontSize - 4,
        color: rgb(0, 0, 0),
        lineHeight: tocFontSize,
        opacity: 1,
      });

      contentY -= tocFontSize + tocEntryMargin;
    }
    for (
      let i = tocPageIndex + 1;
      i < Math.ceil(matchingChapters.length / 24);
      i++
    ) {
      tocPage = tocPdf.addPage([tocPageWidth, tocPageHeight]);
    }
    // step 5 add title page
    const titlePdf = await PDFDocument.create();
    const titlePageWidth = 432;
    const titlePageHeight = 648;
    const titleFont = await titlePdf.embedFont(StandardFonts.TimesRoman);
    const titleFontSize = 26;

    let titleContentY = titlePageHeight - titleFontSize - 130;
    let titlePage = titlePdf.addPage([titlePageWidth, titlePageHeight]);

    const titleText = bookName;
    const titleSubtitle = processedSubtitle;
    const titleTextWidth = titleFont.widthOfTextAtSize(
      titleText,
      titleFontSize + 70
    );
    const titleSubtitleWidth = titleFont.widthOfTextAtSize(
      titleSubtitle,
      titleFontSize - 6
    );

    const titleTextX = Math.max((titlePageWidth - titleTextWidth) / 2, 0);
    const titleSubtitleX = (titlePageWidth - titleSubtitleWidth) / 2;

    const titleTextY = titleContentY - 70;
    const titleSubtitleY = titleTextY - 90;

    const drawTextWithLineBreak = (text, x, y, font, size, color, maxWidth) => {
      const words = text.split(" ");
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const testLine = currentLine + " " + words[i];
        const testWidth = titleFont.widthOfTextAtSize(testLine, size);

        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          const xOffset =
            (maxWidth - titleFont.widthOfTextAtSize(currentLine, size)) / 2;
          titlePage.drawText(currentLine, {
            x:  xOffset,
            y,
            font,
            size,
            color,
          });

          y -= size + 5;
          currentLine = words[i];
        }
      }
      const xOffset =
        (maxWidth - titleFont.widthOfTextAtSize(currentLine, size)) / 2;
      titlePage.drawText(currentLine, {
        x:  xOffset,
        y,
        font,
        size,
        color,
      });
    };
    drawTextWithLineBreak(
      titleText,
      titleTextX,
      titleTextY,
      titleFont,
      titleFontSize,
      rgb(0, 0, 0),
      titlePageWidth
    );
    titlePage.drawText(titleSubtitle, {
      x: titleSubtitleX,
      y: titleSubtitleY,
      font: titleFont,
      size: titleFontSize - 6,
      color: rgb(0, 0, 0),
    });
    const lineY = titleTextY - 500;
    const titleLineX = (titlePageWidth - 400) / 2;
    const pngImageBytes = fs.readFileSync(
      path.join(__dirname, "../images/linebar.png")
    );
    const pngImage = await titlePdf.embedPng(pngImageBytes);
    titlePage.drawImage(pngImage, {
      x: titleLineX + 6,
      y: lineY,
      width: 400,
      height: 500,
    });

    const authorText = processedAuthor;
    const authorTextWidth = titleFont.widthOfTextAtSize(
      authorText,
      titleFontSize - 6
    );
    const authorTextX = (titlePageWidth - authorTextWidth) / 2;
    const authorTextY = titleTextY - 360;

    titlePage.drawText(authorText, {
      x: authorTextX,
      y: authorTextY,
      font: titleFont,
      size: titleFontSize - 6,
      color: rgb(0, 0, 0),
    });

    //step 6 merge pdf pages
    const mergedPdf = await PDFDocument.create();
    const tocPdfBytes = await tocPdf.save();
    const tocPdfDoc = await PDFDocument.load(tocPdfBytes);
    const originalPdfDoc = await PDFDocument.load(s3FileContent);
    const titlePages = await mergedPdf.copyPages(
      titlePdf,
      titlePdf.getPageIndices()
    );
    titlePages.forEach((titlePage) => mergedPdf.addPage(titlePage));
    const tocPages = await mergedPdf.copyPages(
      tocPdfDoc,
      tocPdfDoc.getPageIndices()
    );
    tocPages.forEach((tocPage) => mergedPdf.addPage(tocPage));
    const originalContentPages = await mergedPdf.copyPages(
      originalPdfDoc,
      originalPdfDoc.getPageIndices()
    );
    originalContentPages.forEach((contentPage) =>
      mergedPdf.addPage(contentPage)
    );

    // Step 7: Upload the merged PDF with TOC to AWS S3
    const mergedPdfBytes = await mergedPdf.save();
    const mergedPdfParams = {
      Bucket: `www.mystoryvault.co/${process.env.BUCKET}/mystorybooks`,
      Key: `${bookName}${awsUserId}.pdf`,
      Body: mergedPdfBytes,
      ACL: "public-read",
      ContentType: "application/pdf",
    };
    const mergedPdfUploadResponse = await s3.upload(mergedPdfParams).promise();
    const mergedPdfUrl = mergedPdfUploadResponse.Location;
    fs.unlinkSync(pdfFilePath);
    await browser.close();
    res.status(200).json({ url: mergedPdfUrl });
  } catch (error) {
    console.error("Error generating PDF with TOC:", error);
    res.status(500).json({ message: error.message });
  }
};

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION1,
});

const uploadToDisk = multer({ dest: "uploads/" });

exports.uploadImage = (req, res) => {
  uploadToDisk.single("image")(req, res, async (err) => {
    if (err) {
      console.error("Error uploading file to local storage:", err);
      res.status(500).json({ error: "Error uploading file to local storage." });
    } else {
      try {
        const imageBuffer = fs.readFileSync(req.file.path);
        const resizedImage = await sharp(imageBuffer)
          .resize({ width: 1024, height: 1024, fit: "inside" })
          .toBuffer();

        const uploadParams = {
          Bucket: `www.mystoryvault.co/${process.env.BUCKET}/StoryBookImages`,
          Key: req.file.originalname,
          Body: resizedImage,
          ACL: "public-read",
          ContentType: "image/png",
        };

        const s3UploadResponse = await s3.upload(uploadParams).promise();

        const imageUrl = s3UploadResponse.Location;

        fs.unlinkSync(req.file.path);

        res.json({
          message: "File uploaded and resized successfully.",
          imageUrl,
        });
      } catch (resizeError) {
        console.error("Error resizing and uploading file:", resizeError);
        res.status(500).json({ error: "Error resizing and uploading file." });
      }
    }
  });
};

exports.coverImagetoPdf = async (req, res) => {
  const { bookName, awsUserId, spineWidth, page_count } = req.body;

  try {
    const coverImageUrl = `https://s3.us-west-2.amazonaws.com/www.mystoryvault.co/${process.env.BUCKET}/bookcovers/${bookName}final${awsUserId}.png`;
    if (!coverImageUrl) {
      return res.status(404).json({ message: "Cannot get File." });
    }

    let Total_Width = spineWidth;
    if (page_count <= 84) {
      if (Total_Width < 13.938 * 72) {
        Total_Width = 13.96 * 72;
      } else if (Total_Width > 14.062 * 72) {
        Total_Width = 14.05 * 72;
      } else {
        Total_Width = 14.0 * 72;
      }
    } else if (page_count <= 140) {
      if (Total_Width < 14.188 * 72) {
        Total_Width = 14.2 * 72;
      } else if (Total_Width > 14.312 * 72) {
        Total_Width = 14.3 * 72;
      } else {
        Total_Width = 14.25 * 72;
      }
    } else if (page_count <= 194) {
      if (Total_Width < 14.39 * 72) {
        Total_Width = 14.39 * 72;
      } else if (Total_Width > 14.501 * 72) {
        Total_Width = 14.49 * 72;
      } else {
        Total_Width = 14.45 * 72;
      }
    } else if (page_count <= 250) {
      if (Total_Width < 14.501 * 72) {
        Total_Width = 14.56 * 72;
      } else if (Total_Width > 14.6 * 72) {
        Total_Width = 14.56 * 72;
      } else {
        Total_Width = 14.56 * 72;
      }
    } else {
      if (Total_Width < 14.626 * 72) {
        Total_Width = 14.66 * 72;
      } else if (Total_Width > 14.751 * 72) {
        Total_Width = 14.751 * 72;
      } else {
        Total_Width = 14.7 * 72;
      }
    }
    const coverPdf = await PDFDocument.create();
    const coverPage = coverPdf.addPage([Total_Width, 777]);

    const coverImageBytes = await fetch(coverImageUrl).then((response) =>
      response.arrayBuffer()
    );
    const convertedImageBuffer = await sharp(coverImageBytes)
      .toFormat("png")
      .toBuffer();
    const coverImage = await coverPdf.embedPng(convertedImageBuffer);

    const coverImageWidth = coverImage.width;
    const coverImageHeight = coverImage.height;

    const aspectRatio = coverImageWidth / coverImageHeight;

    let targetWidth = Total_Width;
    let targetHeight = targetWidth / aspectRatio;

    if (targetHeight > 777) {
      targetHeight = 777;
    }

    const xPosition = (Total_Width - targetWidth) / 2;

    coverPage.drawImage(coverImage, {
      x: xPosition,
      y: 0,
      width: targetWidth,
      height: targetHeight,
    });

    const pdfBytes = await coverPdf.save();

    const params = {
      Bucket: `www.mystoryvault.co/${process.env.BUCKET}/Pdfcovers`,
      Key: `${bookName}${awsUserId}.pdf`,
      Body: pdfBytes,
      ACL: "public-read",
      ContentType: "application/pdf",
    };

    const s3UploadResponse = await s3.upload(params).promise();

    const pdfUrl = s3UploadResponse.Location;

    res.send({ url: pdfUrl });
  } catch (error) {
    console.error("Error converting cover image to PDF:", error);
    res
      .status(500)
      .json({
        message: "Error converting cover image to PDF.",
        error: error.message,
      });
  }
};

exports.printBook = async (req, res) => {
  try {
    const users = await User.findOne({
      where: {
        awsUserId: req.body.awsUserId,
      },
    });
    if (!users) {
      return res.status(400).json({ message: "User not found" });
    }
    const userId = users?.userId;
    await users.update({
      free_book: 1,
    });

    const books = await Book.findOne({
      where: {
        bookId: req.body.bookId,
      },
    });

    await books.update({
      printed: 1,
    });
    const shipping_address = `${req.body.street}, ${req.body.city}, ${req.body.state_code}, ${req.body.country_code}, ${req.body.postcode}`;
    const printBookCreated = await printBook.create({
      user_id: userId,
      book_id: req.body.bookId,
      orderId: req.body.orderId,
      phone: req.body.phone,
      shipping_address: shipping_address,
      quantity: req.body.quantity,
      lulu_printCharges: req.body.lulu_printCharge,
      user_printCharges: req.body.user_printCharge || 0,
      bookCoverUrl: req.body.bookCoverUrl,
      storyBookUrl: req.body.storyBookUrl,
    });
    res.status(200).json({
      status: true,
      data: successResponse(printBookCreated),
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      message: errorResponse(err.message),
    });
  }
};

exports.getOrderId = async (req, res) => {
  const bookId = req.params.id;
  try {
    const print = await printBook.findOne({
      where: {
        book_id: bookId,
      },
    });
    if (!print) {
      return res
        .status(404)
        .json({ message: "Order Id against that book not found" });
    } else {
      return res.status(200).json({
        orderId: print.orderId,
      });
    }
  } catch (err) {
    res.status(400).json({
      status: false,
      message: errorResponse(err.message),
    });
  }
};

exports.printChargesCalculation = async (req, res) => {
  try {
    let shipping = req.body.shipping_charges;
    const shipping_charges = Math.ceil(shipping);
    const voucher_code = req.body.voucher_code;
    let quantity = req.body.quantity;
    let total_amount;
    let discounted_amount;
    let discount = 0;
    let amount = req.body.amount;
    const bookprinted = await Book.findOne({
      where: {
        bookId: req.body.bookId,
      },
    });
    if (!bookprinted) {
      return res.status(400).json({ message: "print status not found" });
    }
    const printStatus = bookprinted.printed;
    const users = await User.findOne({
      where: {
        awsUserId: req.body.awsUserId,
      },
    });
    if (!users) {
      return res.status(400).json({ message: "User not found" });
    }

    let user_charges;

    if (voucher_code) {
      const vouchers = await Voucher.findOne({
        where: {
          voucher_code: voucher_code,
        },
      });
      if (!vouchers) {
        return res.status(404).json({ message: "Vocuher code does not exists" });
      }
      if (vouchers.status === 1) {
        return res.status(400).json({ message: "Voucher expired" });
      }
      discount = vouchers.amount;
      if (users.free_book == 0) {
        if (quantity == 1) {
          user_charges = 0;
        } else {
          user_charges = (quantity - 1) * 79;
        }
      } else {
        if (printStatus) {
          user_charges = quantity * 79;
        } else {
          if (quantity == 1) {
            user_charges = 139;
          } else {
            user_charges = 139 + (quantity - 1) * 79;
          }
        }
      }

      total_amount = user_charges + shipping_charges;
      if (amount) {
        discounted_amount = amount - discount;
      } else {
        discounted_amount = total_amount - discount;
      }
      await vouchers.update({
        status: 1,
      });
    } else {
      if (users.free_book == 0) {
        if (quantity == 1) {
          user_charges = 0;
        } else {
          user_charges = (quantity - 1) * 79;
        }
      } else {
        if (printStatus) {
          user_charges = quantity * 79;
        } else {
          if (quantity == 1) {
            user_charges = 139;
          } else {
            user_charges = 139 + (quantity - 1) * 79;
          }
        }
      }
      total_amount = user_charges + shipping_charges;
      discounted_amount = user_charges + shipping_charges;
    }

    res.json({ total_amount, discount, discounted_amount, user_charges });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.freebookStatus = async (req, res) => {
  try {
    const users = await User.findOne({
      where: {
        awsUserId: req.params.id,
      },
    });
    if (!users) {
      return res.status(400).json({ message: "User not found" });
    }
    return res.status(200).json({
      free_book: users.free_book,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPageCount = async (req, res) => {
  try {
    const books = await Book.findOne({
      where: {
        bookId: req.params.id,
      },
    });
    if (!books) {
      return res.status(400).json({ message: "book not found" });
    }
    return res.status(200).json({
      page_count: books.page_count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.calculatePromotionVoucher = async (req, res) => {
  try {
    const { promo_code, total_price, awsUserId } = req.body;
    let final_amount;
    const free_code = process.env.FREE_ACCESS;
    if (promo_code == free_code) {
      return res.status(200).json({
        total_cost: 0,
      });
    }
    const date = new Date();
    const users = await User.findOne({
      where: {
        awsUserId: awsUserId,
      },
    });
    if (!users) {
      return res.status(400).json({ message: "User not found" });
    }
    const userId = users.userId;
    const promo_voucher = await Promotion.findOne({
      where: {
        promo_code: promo_code,
      },
    });
    if (!promo_voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }
    const voucher_redemption = await Redemption.findOne({
      where: {
        promo_id: promo_voucher.promo_id,
        user_id: userId,
      },
    });
    if (!voucher_redemption) {
      const validFrom = new Date(promo_voucher.valid_from);
      const validTill = new Date(promo_voucher.valid_till);
      if (date >= validFrom && date <= validTill) {
        const discount = promo_voucher.promo_value;
        let calculation = (discount / 100) * total_price;

        final_amount = total_price - calculation;

        const userRedemption = await Redemption.create({
          user_id: userId,
          promo_id: promo_voucher.promo_id,
        });

        return res.status(200).json({
          total_cost: final_amount,
        });
      } else {
        return res.status(400).json({ message: "voucher is not valid" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "voucher has been redeemed already" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.bookTitleExist = async (req, res) => {
  const { awsUserId, title } = req.body;
  try {
    const existingBook = await Book.findOne({
      where: {
        title: title,
      },
      include: [
        {
          model: User,
          as: "user",
          where: {
            awsUserId: awsUserId,
          },
        },
      ],
    });
    if (existingBook) {
      return res
        .status(400)
        .json({ status: false, message: "Title already exists" });
    }

    res.status(200).json({
      status: true,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: errorResponse(err.message),
    });
  }
};

const uploadCoverImage = multer({ dest: "uploads/" });

exports.uploadCoverImageToS3 = async (req, res) => {
  uploadCoverImage.single("image")(req, res, async (err) => {
    if (err) {
      console.error("Error uploading file to local storage:", err);
      res.status(500).json({ error: "Error uploading file to local storage." });
    } else {
      try {
        const imageBuffer = fs.readFileSync(req.file.path);

        const resizedImage = await sharp(imageBuffer)
          .resize({ width: 1024, height: 1024, fit: "inside" })
          .toBuffer();

        const uploadParams = {
          Bucket: `www.mystoryvault.co/${process.env.BUCKET}/bookcovers/images`,
          Key: `${new Date().getTime()}-${Math.random()}.png`,
          Body: resizedImage,
          ACL: "public-read",
          ContentType: "image/png",
        };

        const s3UploadResponse = await s3.upload(uploadParams).promise();

        const imageUrl = s3UploadResponse.Location;
        fs.unlinkSync(req.file.path);

        res.json({
          message: "File uploaded and resized successfully.",
          imageUrl,
        });
      } catch (resizeError) {
        console.error("Error resizing and uploading file:", resizeError);
        res.status(500).json({ error: "Error resizing and uploading file." });
      }
    }
  });
};

exports.isExistStoryBook = async (req, res) => {
  const { awsUserId, bookId } = req.body;
  const books = await Book.findOne({
    attributes: ["bookId", "title"],
    where: {
      bookId: bookId,
    },
  });
  if (!books) {
    return res.status(400).json({ message: "book not found" });
  }
  const bookName = books.title;

  const s3Bucket = `www.mystoryvault.co/${process.env.BUCKET}/mystorybooks`;
  const pdfFilePath = `${bookName}${awsUserId}.pdf`;

  const params = {
    Bucket: s3Bucket,
    Key: pdfFilePath,
  };

  s3.headObject(params, (err, data) => {
    if (err) {
      if (err.code === "NotFound") {
        res.status(200).json({ exists: false });
      } else {
        console.error("Error checking the file:", err);
        res.status(500).json({ error: "Error checking the file.", err });
      }
    } else {
      res.status(200).json({ exists: true });
    }
  });
};

exports.coverPdfToLulu = async (req, res) => {
  const { bookName, awsUserId } = req.body;

  let date = Date.now();
  if (!bookName || !awsUserId) {
    return res
      .status(400)
      .json({ message: "Missing bookName or awsUserId in the request." });
  }

  try {
    const pdfCoverUrl = `https://s3.us-west-2.amazonaws.com/www.mystoryvault.co/${process.env.BUCKET}/Pdfcovers/${bookName}${awsUserId}.pdf`;
    const pdfStoryUrl = `https://s3.us-west-2.amazonaws.com/www.mystoryvault.co/${process.env.BUCKET}/mystorybooks/${bookName}${awsUserId}.pdf`;

    const [responseCover, responseStory] = await Promise.all([
      fetch(pdfCoverUrl),
      fetch(pdfStoryUrl),
    ]);

    if (!responseCover.ok) {
      return res
        .status(responseCover.status)
        .json({ message: "Failed to fetch Cover File." });
    }

    if (!responseStory.ok) {
      return res
        .status(responseStory.status)
        .json({ message: "Failed to fetch Story File." });
    }

    const [coverPdfArrayBuffer, storyPdfArrayBuffer] = await Promise.all([
      responseCover.arrayBuffer(),
      responseStory.arrayBuffer(),
    ]);

    const coverParams = {
      Bucket: `www.mystoryvault.co/${process.env.BUCKET}/lulu`,
      Key: `${bookName}${awsUserId}luluBookCover${date}.pdf`,
      Body: Buffer.from(coverPdfArrayBuffer),
      ACL: "public-read",
      ContentType: "application/pdf",
    };

    const storyParams = {
      Bucket: `www.mystoryvault.co/${process.env.BUCKET}/lulu`,
      Key: `${bookName}${awsUserId}luluStoryBook${date}.pdf`,
      Body: Buffer.from(storyPdfArrayBuffer),
      ACL: "public-read",
      ContentType: "application/pdf",
    };

    const [s3UploadCoverResponse, s3UploadStoryResponse] = await Promise.all([
      s3.upload(coverParams).promise(),
      s3.upload(storyParams).promise(),
    ]);

    const coverPdfUrl = s3UploadCoverResponse.Location;
    const storyPdfUrl = s3UploadStoryResponse.Location;

    res.json({ coverUrl: coverPdfUrl, storyUrl: storyPdfUrl });
  } catch (error) {
    console.error("Error uploading pdf:", error);
    res
      .status(500)
      .json({ message: "Error uploading pdf.", error: error.message });
  }
};

exports.getPrintJobsByUserId = async (req, res) => {
  try {
    const { awsUserId } = req.params;

    const printJobs = await User.findOne({
      where: { awsUserId },
      include: [
        {
          model: printBook,
          as: "printbooks",
          where: { user_id: sequelize.col("printbooks.user_id") },
          include: [
            {
              model: Book,
              as: "book",
              attributes: ["title"],
            },
          ],
        },
      ],
    });

    if (!printJobs) {
      return res.status(400).json({ message: "No Print Jobs Found" });
    }

    console.log("printjobs:", printJobs);
    const printJobDetails = printJobs.printbooks.map((printJob) => {
      const book = printJob.book;
      console.log("bookkkkkkk", printJob);

      return {
        orderId: printJob.orderId,
        bookName: book?.title,
        quantity: printJob.quantity,
        Charges: printJob.user_printCharges,
        storyBookUrl: printJob.storyBookUrl,
        bookCoverUrl: printJob.bookCoverUrl,
        Date: printJob.createdAt,
      };
    });

    res.status(200).json(printJobDetails);
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};
