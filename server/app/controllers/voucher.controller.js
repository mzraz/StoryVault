const db = require("../models");
const AWS = require("aws-sdk");
const { PDFDocument } = require("pdf-lib");
const Voucher = db.voucher;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const multer = require("multer");
const multerS3 = require("multer-s3");
const Payment = db.payment;
const User = db.users;
const Promotion = db.promotion_voucher;
const Redemption = db.promo_redemption;

exports.createVoucher = async (req, res) => {
  const {
    from_name,
    from_email,
    to_name,
    to_email,
    amount,
    voucher_code,
    status,
  } = req.body;

  const voucherExist = await Voucher.findOne({
    where: {
      voucher_code: req.body.voucher_code,
    },
  });
  if (voucherExist) {
    return res
      .status(400)
      .json({ message: "generate another voucher code, it exists already" });
  }

  try {
    let voucher = {};
    if (req.body.title != "") {
      voucher = {
        from_name,
        from_email,
        to_name,
        to_email,
        amount,
        voucher_code,
        status,
      };
      const voucherCreated = await Voucher.create(voucher);
      res.status(200).json({
        status: true,
        data: voucherCreated,
      });
    } else {
      res.status(400).json({
        status: false,
        message: "details can not be nulled",
      });
    }
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

exports.paymentIntentvoucher = async (req, res) => {
  try {
    const { amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
    });
    res.json({ clientSecret: paymentIntent.client_secret, amount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION1,
});

const s3 = new AWS.S3();
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: `www.mystoryvault.co/${process.env.BUCKET}/voucher`,
    ACL: "public-read",
    ContentType: "image/png",
    key: function (req, file, cb) {
      const { voucher_code } = req.body;
      const fileName = `voucher${voucher_code}.png`;
      cb(null, fileName);
    },
  }),
});

exports.uploadVoucherFile = (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("Error uploading file:", err);
      res.status(500).json({ error: "Error uploading file." });
    } else {
      const imageUrl = req.file.location;
      res.json({ message: "File uploaded successfully.", imageUrl });
    }
  });
};
const SESConfig = {
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
};
const ses = new AWS.SES(SESConfig);
exports.sendVoucherEmail = async (req, res) => {
  try {
    const { from_email, to_email, amount, voucher_code, to_check, from_check } =
      req.body;
    const voucherId = await Voucher.findOne({
      where: {
        voucher_code: voucher_code,
      },
    });

    const voucher_id = voucherId.voucher_id;
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
          .voucherdiv{
            background-color: white;
            padding: 5px 5px;
            width:"100%";
            max-width:"30px";
            margin:"auto";
            text-align: center;
           }
          .voucherdiv h1 h2 p{
            background-color: white;
            padding: 5px 5px;
            width:"100%";
            max-width:"100px";
            margin:"auto";
            text-align: center;
            color: black !important;
          }
         
      </style>
  </head>
  
  <body>
      <div class="container">
          <div class='stripdiv'></div>
          <div class='header_class'>
              <img class="logo" src="https://s3.us-west-2.amazonaws.com/www.mystoryvault.co/logo2.png" alt="Logo" />
          </div>
       
          <div class='voucherdiv'>
          <h1> <strong>Gift Voucher </strong> </h1>
          <div class='hr_class'>
          <hr/>
          </div>
          <h2> $<strong> ${amount} </strong></h2>
          <p> Your Voucher Code </p>
          <h2> <strong> ${voucher_code} </strong> </h2>
          <p><a class="white" href="${`https://s3.us-west-2.amazonaws.com/www.mystoryvault.co/${process.env.BUCKET}/pdf_vouchers/voucher${voucher_id}.pdf`}" download="voucher${voucher_id}.pdf">Click here to download your voucher</a></p>
          </div>
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
    let emailParams = {};
    if (to_check && from_check) {
      emailParams = {
        Destination: {
          ToAddresses: [from_email, to_email],
        },
        Message: {
          Body: {
            Html: {
              Data: emailBodyHtml,
            },
            Text: {
              Data: `You have purchased a voucher of $${amount} successfully`,
            },
          },
          Subject: {
            Data: "Voucher payment",
          },
        },
        Source: "invitation@mystoryvault.co",
      };
    } else if (to_check) {
      console.log("to", to_check, to_email);
      emailParams = {
        Destination: {
          ToAddresses: [to_email],
        },
        Message: {
          Body: {
            Html: {
              Data: emailBodyHtml,
            },
            Text: {
              Data: `You have purchased a voucher of $${amount} successfully`,
            },
          },
          Subject: {
            Data: "Voucher payment",
          },
        },
        Source: "invitation@mystoryvault.co",
      };
    } else if (from_check) {
      console.log("from", from_check, from_email);
      emailParams = {
        Destination: {
          ToAddresses: [from_email],
        },
        Message: {
          Body: {
            Html: {
              Data: emailBodyHtml,
            },
            Text: {
              Data: `You have purchased a voucher of $${amount} successfully`,
            },
          },
          Subject: {
            Data: "Voucher payment",
          },
        },
        Source: "invitation@mystoryvault.co",
      };
    } else {
      return res
        .status(200)
        .json({
          message: "User must select any checkbox to send mail to someone",
        });
    }
    const sendEmailPromise = ses.sendEmail(emailParams).promise();
    const data = await sendEmailPromise;
    if (!data.MessageId) {
      throw new Error("Email sending failed");
    }
    console.log(`Email sent: ${data.MessageId}`);
    res.status(200).json({ message: "email sent successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while sending email." });
  }
};

exports.createpayment = async (req, res) => {
  const {
    name,
    email,
    phone,
    line1,
    line2,
    city,
    state,
    postal_code,
    country,
  } = req.body;
  const combinedAddress = `${line1},${line2}, ${city}, ${state}, ${postal_code}, ${country}`;
  const userExists = await User.findOne({
    where: {
      email: email,
    },
  });

  if (!userExists) {
    return res
      .status(400)
      .json({ message: "There is no user with this email" });
  }
  const user_id = userExists.userId;
  try {
    const payment = await Payment.create({
      user_id,
      name,
      email,
      phone,
      address: combinedAddress,
    });
    await User.update(
      {
        status: 1,
      },
      {
        where: {
          userId: user_id,
        },
      }
    );
    res.status(200).json({ message: "payment created successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.vouchertoPdf = async (req, res) => {
  try {
    const { voucher_code } = req.body;
    if (!voucher_code) {
      return res.status(404).json({ message: "voucher code required" });
    }
    const voucherId = await Voucher.findOne({
      where: {
        voucher_code: voucher_code,
      },
    });

    const voucher_id = voucherId.voucher_id;
    const coverImageUrl = `https://s3.us-west-2.amazonaws.com/www.mystoryvault.co/${process.env.BUCKET}/voucher/voucher${voucher_code}.png`;
    if (!coverImageUrl) {
      return res.status(404).json({ message: "Cannot get File." });
    }
    let Total_Width = 882;

    const coverPdf = await PDFDocument.create();
    const coverPage = coverPdf.addPage([Total_Width, 500]);

    const coverImageBytes = await fetch(coverImageUrl).then((response) =>
      response.arrayBuffer()
    );
    const coverImage = await coverPdf.embedPng(coverImageBytes);

    const coverImageWidth = coverImage.width;
    const coverImageHeight = coverImage.height;

    const aspectRatio = coverImageWidth / coverImageHeight;

    let targetWidth = Total_Width;
    let targetHeight = targetWidth / aspectRatio;

    const xPosition = (Total_Width - targetWidth) / 2;

    coverPage.drawImage(coverImage, {
      x: xPosition,
      y: 0,
      width: targetWidth,
      height: targetHeight,
    });

    const pdfBytes = await coverPdf.save();

    const params = {
      Bucket: `www.mystoryvault.co/${process.env.BUCKET}/pdf_vouchers`,
      Key: `voucher${voucher_id}.pdf`,
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

exports.checkVoucherValidity = async (req, res) => {
  try {
    const checkVoucher = await Voucher.findOne({
      where: {
        voucher_code: req.body.voucher_code,
      },
    });
    if (!checkVoucher) {
      return res.status(400).json({ message: "voucher is not valid" });
    }
    if (checkVoucher.status) {
      return res
        .status(400)
        .json({ message: "voucher has been redeemed already" });
    }
    if (req.body.amount < 139) {
      return res
        .status(400)
        .json({
          message: "Gift Voucher can only apply on amount $139 or more ",
        });
    }
    return res.status(200).json({ message: "voucher redeemed successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.checkoutVoucherStatusUpdate = async (req, res) => {
  try {
    const checkVoucher = await Voucher.findOne({
      where: {
        voucher_code: req.body.voucher_code,
      },
    });
    if (!checkVoucher) {
      return res.status(400).json({ message: "voucher is not valid" });
    }
    const findUser = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (!findUser) {
      return res.status(400).json({ message: "user with email not found" });
    }
    await Voucher.update(
      {
        status: 1,
      },
      {
        where: {
          voucher_code: req.body.voucher_code,
        },
      }
    );
    await User.update(
      {
        status: 1,
      },
      {
        where: {
          email: req.body.email,
        },
      }
    );
    return res
      .status(200)
      .json({ message: "voucher status update successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.checkoutPromotionVoucher = async (req, res) => {
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
