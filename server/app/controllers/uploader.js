const util = require("util");
const multer = require("multer");
const maxSize = 2 * 1024 * 1024;

let storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + "/uploads/");
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    cb(null, file.originalname);
  },
});

let uploadFile = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "application/vnd.android.package-archive" || file.mimetype == "application/octet-stream") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only apk file format allowed!'));
    }
  }
}).single("file");

let uploadFileMiddleware = util.promisify(uploadFile);
module.exports = uploadFileMiddleware;
