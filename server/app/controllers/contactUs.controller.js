const db = require("../models");
const Contact = db.contactUs;
const AWS = require("aws-sdk");

const SESConfig = {
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
};
const ses = new AWS.SES(SESConfig);

exports.sendContactEmail = async (req, res) => {
  {
    try {
      const { email, subject, message } = req.body;

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
          .user-message {
            background-color: #fff; / Set a white background for user messages /
            padding: 20px;
            border-radius: 4px;
            margin-top: 20px;
        }
      </style>
  </head>  
  <body>
      <div class="container">
          <div class='stripdiv'></div>
          <div class='header_class'>
              <img class="logo" src="https://s3.us-west-2.amazonaws.com/www.mystoryvault.co/logo2.png" alt="Logo" />
          </div>         
          <p><strong>Contact Form Submission</strong></p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div class="user-message">
              ${message}
          </div>     
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
      const recieverEmail = "admin@mystoryvault.co";
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
              Data: message,
            },
          },
          Subject: {
            Data: "Contact Us Message",
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
      res.status(500).json({ error: message.error });
    }
  }
};

exports.createContact = async (req, res) => {
  const { email, subject, message } = req.body;

  try {
    if (!email || !subject || !message) {
      return res.status(400).json({ message: "All fields required" });
    }
    const contactCreated = await Contact.create({
      email: email,
      subject: subject,
      message: message,
    });
    res.status(200).json({
      status: true,
      data: contactCreated,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};
