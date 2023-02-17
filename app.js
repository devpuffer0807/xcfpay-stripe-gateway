const express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var formData = require("express-form-data");
var logger = require("morgan");
var { ValidationError } = require("express-validation");
var os = require("os");
var cors = require("cors");
require("dotenv").config();

/**
 * Routes
 */
const paymentRouter = require("./src/routes/payment");

/** ---------------------------------------- */

/**
 * Express App Config
 */
var app = express();

app.use(logger("dev"));

app.use((req, res, next) => {
  if (req.originalUrl === '/stripe_hook') {
    var data = "";
    req.setEncoding("utf8");
    req.on("data", function (chunk) {
      data += chunk;
    });

    req.on("end", function () {
      req.body = data;
      next();
    });
  } else {
    express.json()(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true }));

app.use(formData.parse({ uploadDir: os.tmpdir(), autoClean: true }));
app.use(cookieParser());
app.use("/images", express.static(path.join(__dirname, "public/images")));
app.use(cors({ origin: "*" }));

app.use("/", paymentRouter);

app.use(function (err, req, res, next) {
  if (err instanceof ValidationError) {
    let errors = [];
    if (err.details.body) {
      err.details.body.map((item, index) => {
        errors.push({
          key: item.context.key,
          message: item.message,
        });
      });
    }
    if (err.details.params) {
      err.details.params.map((item, index) => {
        errors.push({
          key: item.context.key,
          message: item.message,
        });
      });
    }
    if (err.details.query) {
      err.details.query.map((item, index) => {
        errors.push({
          key: item.context.key,
          message: item.message,
        });
      });
    }

    return res.status(200).json({
      status: false,
      errorCode: "Error_InvalidRequest",
      data: errors,
    });
  }

  console.error(err.message);
  return res.status(500).json(err);
});
/** ---------------------------------------- */

module.exports = app;
