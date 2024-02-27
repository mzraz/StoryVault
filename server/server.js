const http = require('http');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();

const hostname =
  process.env.NODE_ENV == 'development' ? process.env.DEVELOPMENT_HOST : process.env.CLIENT_HOST;
const httpPort = process.env.HTTP_PORT;
const httpsPort = process.env.HTTPS_PORT;
const httpsOptions = {
};

const app = express();
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
    limit: '50mb',
  })
);
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json()(req, res, next); 
  }
});
const corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(
  bodyParser.json({
    limit: '50mb',
  })
);

app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    parameterLimit: 100000,
    extended: true,
  })
);

// routes
const userRoutes = require('./app/routes/users.routes');
const questionRoutes = require('./app/routes/questions.routes');
const chapterQuestionRoutes = require('./app/routes/chapterQuestions.routes');
const voucherRoutes  =require('./app/routes/voucher.routes');
const contactUsRoutes = require('./app/routes/contactUs.routes');
const adminRoutes = require('./app/routes/admin.routes');
require('./app/routes/chapter.routes')(app);
require('./app/routes/book.routes')(app);
app.use('/', userRoutes);
app.use('/', questionRoutes);
app.use('/', chapterQuestionRoutes);
app.use('/', voucherRoutes);
app.use('/', contactUsRoutes);
app.use('/', adminRoutes);

const httpServer = http.createServer(app);
const httpsServer = https.createServer(httpsOptions, app);

const server1 = httpServer.listen(httpPort, hostname, function () {
  let host = server1.address().address;
  let port = server1.address().port;
  console.log('App listening at http://%s:%s', host, port);
});

const server = httpsServer.listen(httpsPort, hostname, function () {
  let host = server.address().address;
  let port = server.address().port;
  console.log('App listening at http://%s:%s', host, port);
});