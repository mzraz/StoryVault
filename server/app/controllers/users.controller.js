const db = require("../models");
const Joi = require("joi");
const User = db.users;
const Book = db.books;
const Invitation = db.invitation;
const AWS = require("aws-sdk");
const multer = require("multer");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const jwt = require("jsonwebtoken");
const mime = require("mime");
const bookchapters = db.bookchapters;
const chapterQuestions = db.chapterquestions;
const payment = db.payment;
const coauthor = db.coauthors;
const sharp = require("sharp");
const fs = require("fs");
const { successResponse, errorResponse } = require("../common/response");

const signUpSchema = Joi.object({
  awsUserId: Joi.string().required(),
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
});

exports.signUp = async (req, res) => {
  const { error, value } = signUpSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const { awsUserId, username, email, firstName, lastName } = value;
  try {
    const existingUserByAwsUserId = await User.findOne({
      where: { awsUserId: awsUserId },
    });
    if (existingUserByAwsUserId) {
      return res
        .status(409)
        .json({ message: "User with this AWS userId already exists" });
    }
    const existingUserByUsername = await User.findOne({
      where: { username: username },
    });
    if (existingUserByUsername) {
      return res
        .status(409)
        .json({ message: "User with this username already exists" });
    }
    const currentDate = new Date();
    const dateOnly = currentDate.toISOString().split("T")[0];
    const user = await User.create({
      awsUserId,
      username,
      email,
      firstName,
      lastName,
      user_verification: 0,
      status: 0,
      login_date: dateOnly,
      free_book: 0,
      imageUrl: "",
    });
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(200).json({ message: "email passed" });
    } else {
      const awsUserId = user.awsUserId;
      return res
        .status(400)
        .json({ message: "Email  already exists", sub: awsUserId });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.verifyUsername = async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (user) {
      return res
        .status(400)
        .json({ message: "This username is already taken. Try another one." });
    }
    return res.status(200).json({ message: "username successfully added" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
exports.verifyForgetEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Email does not exists" });
    }
    return res.status(200).json({ status: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.verifyUser = async (req, res) => {
  const { awsUserId } = req.body;
  try {
    const user = await User.findOne({ where: { awsUserId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.user_verification = true;
    await user.save();
    res.status(200).json({ message: "User verification updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const SESConfig = {
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
};
const ses = new AWS.SES(SESConfig);
const invitationSchema = Joi.object({
  awsUserId: Joi.string().required(),
  recieverEmail: Joi.string().email().required(),
  bookId: Joi.number().required(),
  chapterId: Joi.number().required(),
  questionId: Joi.number().required(),
  status: Joi.number(),
});

exports.sendInvitationEmail = async (req, res) => {
  {
    try {
      const { error, value } = invitationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const {
        awsUserId,
        recieverEmail,
        bookId,
        chapterId,
        questionId,
        status,
      } = value;
      const sender = await User.findOne({ where: { awsUserId: awsUserId } });

      const bookObj = await Book.findOne({ where: { bookId: bookId } });

      const bookName = bookObj.title;
      const author = bookObj.author;

      if (!sender) {
        return res.status(400).json({ message: "Sender not found." });
      }

      const user = await User.findOne({ where: { email: recieverEmail } });
      if (!user) {
        link = `${process.env.URL}build?email=${recieverEmail}&coauthor=true&bookId=${bookId}`;
      } else {
        link = `${process.env.URL}answer/${bookId}?email=${recieverEmail}`;
      }
      const senderUserId = sender.userId;

      const emailBodyHtml = `
<!DOCTYPE html>
<html>

<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 4px;
        }

        h2 {
            color: #333;
            margin-bottom: 20px;
        }

        p {
            margin-bottom: 10px;
        }

        a {
            display: inline-block;
            padding: 10px 20px;
            background-color: #DDC5BF;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
        }

        a.white {
            color: #fff;
        }

        .logo {
            display: block;
            max-width: 150px;
            margin: 0 0 0px -5px;
        }

        .stripdiv {
            padding: 10px 20px;
            background-color: #96C9BF;
            margin: 0 0 5px 0px;
        }
        .header_class{
            background-color: white;
            box-shadow: 4px 8px 6px -8px rgba(0,0,0,0.75);

        }
        .footer_class{
                padding: 1px 10px;
            background-color: #f9f9f9;
          display:flex;
          justify-content: space-between;
           align-items: center;
        }
        .footer_class p {
              font-size: 12px;
              color:#6B7280;
        }
        .hr_class{
            margin-top:25px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class='stripdiv'></div>
        <div class='header_class'>
            <img class="logo" src="https://s3.us-west-2.amazonaws.com/www.mystoryvault.co/logo2.png" alt="Logo" />
        </div>
        <p>Subject:Invitation to contribute in ${bookName}</p>
        <p>Hi,</p>
        <p>MyStoryVault team would like to extend an invitation for you to contribute in ${bookName} being written by <strong> ${
        author ? author : sender.username
      } </strong></p>
        <p><a class="white" href="${
          user
            ? `${process.env.URL}answer/${bookId}?email=${recieverEmail}`
            : `${process.env.URL}build?email=${recieverEmail}&coauthor=true&bookId=${bookId}`
        }">Click here to sign up or answer the question</a></p>
        <p>
            Thank you for considering our invitation. We look forward to your valuable contribution.
        </p>
        <p>Best regards,</p>
        <p>Team MyStoryVault</p>
        
        <div class='hr_class'>
             <hr/>
        </div>    
        <div class='footer_class'>
            <p>
            &copy; 2022 My Story Vault, LLC. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>
    `;

      const emailParams = {
        Destination: {
          ToAddresses: [recieverEmail],
        },
        Message: {
          Body: {
            Html: {
              Data: emailBodyHtml,
            },
            Text: {
              Data: user
                ? "You have been invited to answer this question."
                : "You have been invited to join storyvault and answer these questions.",
            },
          },
          Subject: {
            Data: "Invitation to join my app",
          },
        },
        Source: "invitation@mystoryvault.co",
      };

      const invitationExists = await Invitation.findOne({
        where: {
          bookId: bookId,
          chapterId: chapterId,
          questionId: questionId,
          recieverEmail: recieverEmail,
        },
      });

      if (invitationExists) {
        return res
          .status(400)
          .json({
            message:
              "This user has already been invited to answer this question.",
          });
      }

      const sendEmailPromise = ses.sendEmail(emailParams).promise();
      const data = await sendEmailPromise;
      if (!data.MessageId) {
        throw new Error("Email sending failed");
      }

      console.log(`Email sent: ${data.MessageId}`);

      const invitation = await Invitation.create({
        senderUserId: senderUserId,
        recieverEmail: recieverEmail,
        bookId: bookId,
        chapterId: chapterId,
        questionId: questionId,
        status: status,
      });

      res.status(200).json({ message: "Invitation sent successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: message.error });
    }
  }
};

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION1,
});

const s3 = new AWS.S3();

const uploadToDisk = multer({ dest: "uploads/" });

exports.uploadFile = (req, res) => {
  uploadToDisk.single("image")(req, res, async (err) => {
    if (err) {
      console.error("Error uploading file to local storage:", err);
      res.status(500).json({ error: "Error uploading file to local storage." });
    } else {
      try {
        const { bookName, awsUserId } = req.body;
        const customFileName = `${bookName}${awsUserId}.png`;

        const imageBuffer = fs.readFileSync(req.file.path);

        const resizedImage = await sharp(imageBuffer)
          .resize({ width: 2048, height: 2048, fit: "outside" })
          .webp({ quality: 100 })
          .toBuffer();

        const uploadParams = {
          Bucket: `www.mystoryvault.co/${process.env.BUCKET}/bookcovers`,
          Key: customFileName,
          Body: resizedImage,
          ACL: "public-read",
          ContentType: "image/png",
        };

        const s3UploadResponse = await s3.upload(uploadParams).promise();

        const imageUrl = s3UploadResponse.Location; // Get the URL of the uploaded image

        // Clean up the local storage file
        fs.unlink(req.file.path, (unlinkError) => {
          if (unlinkError) {
            console.error("Error deleting local file:", unlinkError);
          }
        });

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

exports.getFileUrl = (req, res) => {
  const key = req.params.key;
  const params = {
    Bucket: `www.mystoryvault.co/${process.env.BUCKET}/mystorybooks`,
    Key: key,
    Expires: 3600, // URL expiration time in seconds (e.g., 1 hour)
  };

  s3.getSignedUrl("getObject", params, (err, url) => {
    if (err) {
      console.error("Error generating presigned URL:", err);
      res.status(500).json({ error: "Error generating presigned URL." });
    } else {
      const cleanedUrl = url.split("?")[0];
      res.json({ fileUrl: cleanedUrl });
    }
  });
};

exports.login = async (req, res) => {
  const { awsUserId } = req.body;
  try {
    const user = await User.findOne({ where: { awsUserId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const imageUrl = user.imageUrl;
    const firstName = user.firstName;
    const lastName = user.lastName;
    const username = user.username;
    const previousLoginDate = user.login_date;

    if (previousLoginDate === null) {
      user.login_date = new Date();
      await user.save();

      return res.json({
        message: "Login successful",
        imageUrl,
        firstName,
        lastName,
        username,
      });
    } else {
      const currentDate = new Date();
      const previousDate = new Date(previousLoginDate);
      previousDate.setHours(0, 0, 0, 0);

      const timeDifference = currentDate.getTime() - previousDate.getTime();
      const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

      if (daysDifference >= 7) {
        user.login_date = new Date();
        await user.save();

        const welcomeMessage = `Welcome back! We missed you.`;
        return res.json({
          message: welcomeMessage,
          imageUrl,
          firstName,
          lastName,
          username,
        });
      } else {
        user.login_date = new Date();
        await user.save();

        return res.json({
          message: "Login Sucessful",
          imageUrl,
          firstName,
          lastName,
          username,
        });
      }
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.getUserStatus = async (req, res) => {
  const { awsUserId } = req.params;
  try {
    const users = await User.findOne({ where: { awsUserId: awsUserId } });
    if (!users) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({
      status: users.status,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

exports.checkoutStripePayment = async (req, res) => {
  try {
    let amount = req.body.amount;
    let charge = Math.ceil(amount);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: charge * 100,
      currency: "usd",
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getToken = async (req, res) => {
  const { username } = req.body;
  try {
    const user = await User.findOne({ where: { username: username } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const awsUserId = user.awsUserId;
    const email = user.email;

    const imageUrl = user.imageUrl;
    const firstName = user.firstName;
    const lastName = user.lastName;
    const usernam = user.username;

    const token = jwt.sign(
      {
        sub: awsUserId,
        email: email,
        username: username,
      },
      process.env.JWT_SECRET,
      {
        algorithm: "HS256",
        issuer: process.env.ISSUER,
        audience: process.env.AWSCLIENTID,
      }
    );
    res
      .status(200)
      .json({ token: token, imageUrl, firstName, lastName, username: usernam });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  const { awsUserId } = req.body;
  try {
    const users = await User.findOne({ where: { awsUserId: awsUserId } });
    if (!users) {
      return res.status(400).json({ error: "User not found" });
    }
    await users.update(
      {
        status: 1,
      },
      {
        where: {
          awsUserId: awsUserId,
        },
      }
    );
    res.status(200).json({
      message: "Users payment status updated",
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

exports.sendWelcomeEmail = async (req, res) => {
  {
    try {
      const { recieverEmail } = req.body;
      const sender = await User.findOne({ where: { email: recieverEmail } });

      if (!sender) {
        return res.status(400).json({ message: "Sender not found." });
      }
      const username = sender.username;

      const emailBodyHtml = `
<!DOCTYPE html>
<html>

<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.5;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
            border-radius: 4px;
        }

        h2 {
            color: #333;
            margin-bottom: 20px;
        }

        p {
            margin-bottom: 10px;
        }

        a {
            display: inline-block;
            padding: 10px 20px;
            background-color: #DDC5BF;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
        }

        a.white {
            color: #fff;
        }

        .logo {
            display: block;
            max-width: 150px;
            margin: 0 0 0px -5px;
        }

        .stripdiv {
            padding: 10px 20px;
            background-color: #96C9BF;
            margin: 0 0 5px 0px;
        }
        .header_class{
            background-color: white;
            box-shadow: 4px 8px 6px -8px rgba(0,0,0,0.75);

        }
        .footer_class{
                padding: 1px 10px;
            background-color: #f9f9f9;
          display:flex;
          justify-content: space-between;
           align-items: center;
        }
        .footer_class p {
              font-size: 12px;
              color:#6B7280;
        }
        .hr_class{
            margin-top:25px;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class='stripdiv'></div>
        <div class='header_class'>
            <img class="logo" src="https://s3.us-west-2.amazonaws.com/www.mystoryvault.co/logo2.png" alt="Logo" />
        </div>
        <p><strong>Hi ${username}</strong>,</p>
        <p>Welcome to My Story Vault and thank you for your purchase. We are excited for you to kickstart your writing adventure today. Here are a few tips to ensure a seamless experience. 

        <ul>
            <li>After designing your book cover please select the chapters and questions that will help prompt writing the most relevant experiences and events for you.</li> 
            <li>If our chapters and questions aren’t tailored to your personal experiences please create your own.</li>
            <li>Remember that everyone's life story is unique, and there is no right or wrong way to answer customized life story questions. The most important thing is to be true to yourself and share your experiences authentically.</li>
        </ul>
           <p> We are trying to make My Story Vault better all the time, please reach out to us with your questions and suggestions at <a href="mailto:admin@mystoryvault.co">admin@mystoryvault.co</a> </p>
        </p>
        <p>
            Thank you for considering our Web App. We look forward to your valuable contribution.
        </p>
        <p>Best regards,</p>
        <p>Team MyStoryVault</p>
        <div class='hr_class'>
             <hr/>
        </div>
        <div class='footer_class'>
            <p>
            &copy; 2022 My Story Vault, LLC. All rights reserved.
            </p>  
        </div>
    </div>
</body>
</html>
    `;

      const emailParams = {
        Destination: {
          ToAddresses: [recieverEmail],
        },
        Message: {
          Body: {
            Html: {
              Data: emailBodyHtml,
            },
            Text: {
              Data: "Welcome to My Story Vault",
            },
          },
          Subject: {
            Data: "Welcome to My Story Vault",
          },
        },
        Source: "invitation@mystoryvault.co",
      };

      const sendEmailPromise = ses.sendEmail(emailParams).promise();
      const data = await sendEmailPromise;
      if (!data.MessageId) {
        throw new Error("Email sending failed");
      }

      console.log(`Email sent: ${data.MessageId}`);

      res.status(200).json({ message: "Welcome email sent successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
};

const uploadToDirectory = multer({ dest: "uploads/" });
exports.uploadImageS3 = async (req, res) => {
  uploadToDirectory.single("image")(req, res, async (err) => {
    if (err) {
      console.error("Error uploading file to local storage:", err);
      res.status(500).json({ error: "Error uploading file to local storage." });
    } else {
      try {
        const imageBuffer = fs.readFileSync(req.file.path);
        const mimeType = mime.getType(req.file.originalname);
        const originalFileName = req.file.originalname;
        const fileName = `${originalFileName}${new Date().getTime()}-${Math.random()}.${mime.getExtension(
          mimeType
        )}`;

        const uploadParams = {
          Bucket: `www.mystoryvault.co/${process.env.BUCKET}/DisplayImage`,
          Key: fileName,
          Body: imageBuffer,
          ACL: "public-read",
          ContentType: "image/png",
        };
        const s3UploadResponse = await s3.upload(uploadParams).promise();
        const imageUrl = s3UploadResponse.Location;
        fs.unlink(req.file.path, (unlinkError) => {
          if (unlinkError) {
            console.error("Error deleting local file:", unlinkError);
          }
        });

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

exports.updateUserImage = async (req, res) => {
  const { awsUserId, imageUrl, firstName, lastName } = req.body;
  console.log("body..........", req.body);
  try {
    const users = await User.findOne({ where: { awsUserId: awsUserId } });
    if (!users) {
      return res.status(400).json({ error: "User not found" });
    }
    await users.update(
      {
        imageUrl: imageUrl,
        firstName: firstName,
        lastName: lastName,
      },
      {
        where: {
          awsUserId: awsUserId,
        },
      }
    );
    res.status(200).json({
      message: "Users payment status updated",
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();

const deleteUserFromCognito = (username) => {
  const params = {
    UserPoolId: "us-east-1_66gE23Zml",
    Username: username,
  };

  cognitoIdentityServiceProvider.adminDeleteUser(params, (err, data) => {
    if (err) {
      console.log("error while deleting user from cognito");
    }
  });
};

exports.deleteUser = async (req, res) => {
  try {
    const { awsUserId } = req.body;

    const user = await User.findOne({
      where: {
        awsUserId: awsUserId,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = user.userId;

    const books = await Book.findAll({
      where: { userId: userId },
    });

    for (let i = 0; i < books.length; i++) {
      const findBookChapter = await bookchapters.findAll({
        where: {
          bookId: books[i].bookId,
        },
      });

      const bookChaptersIds = findBookChapter.map((item) => item.id);

      await chapterQuestions.destroy({
        where: { bookChaptersId: bookChaptersIds },
      });

      await bookchapters.destroy({
        where: { bookId: books[i].bookId },
      });

      await Book.destroy({
        where: { bookId: books[i].bookId },
      });
    }

    await payment.destroy({
      where: { user_id: userId },
    });

    await coauthor.destroy({
      where: { userId: userId },
    });

    return res.status(200).json({ message: "All books deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCognitoUser = async (req, res) => {
  try {
    const { awsUserId } = req.body;

    const user = await User.findOne({
      where: {
        awsUserId: awsUserId,
      },
    });

    deleteUserFromCognito(user.username);

    await User.destroy({
      where: { awsUserId: awsUserId },
    });

    return res
      .status(200)
      .json({ message: "User and associated books deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.userMatch = async (req, res) => {
  const { awsUserId, email } = req.body;
  try {
    const user = await User.findOne({
      where: {
        email: email,
      },
    });
    let id;
    if (user) id = user.awsUserId;
    if (user) {
      if (awsUserId === id) {
        return res.status(200).json({ message: "user already login" });
      } else {
        return res.status(401).json({ message: "user need to be login" });
      }
    } else {
      return res.status(400).json({ message: "user need to be signup" });
    }
  } catch (err) {
    res.status(500).json({
      status: false,
      message: errorResponse(err.message),
    });
  }
};
