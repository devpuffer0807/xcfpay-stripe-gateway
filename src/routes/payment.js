/**
 * @author Puffer
 * @dev stripe payment api
 **/

var express = require("express");
var router = express.Router();
var { validate, Joi } = require("express-validation");
var Stripe = require("stripe");
var stripe = Stripe(process.env.STRIPE_SERCRET_KEY);
var { doTransfer } = require("../chain/transfer");
var { getUsdInfo } = require("../chain/token");

/**
 * @dev Render index page
 **/
router.get("/", function (req, res, next) {
  res.send({ API: "Stripe payment api" });
});

/**
 * @method post
 *
 * @param amount Stripe payment request pay amount
 * @param wallet wallet address to get xcf token
 *
 * @dev Stripe payment sheet request error
 **/
router.post(
  "/",
  validate(
    {
      body: Joi.object({
        amount: Joi.number().required(),
        wallet: Joi.string().required(),
      }),
    },
    {},
    { allowUnknown: true, abortEarly: false }
  ),
  async function (req, res, next) {
    try {
      let { amount, wallet } = req.body;
      var customer = await stripe.customers.create();
      var ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: process.env.STRIPE_API_VERSION }
      );
      amount = parseFloat(amount);

      var paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: "usd",
        payment_method_types: ["card"],
        metadata: {
          name: "To up XCF Token",
          address: wallet,
          xcf: amount,
        },
        customer: customer.id,
      });

      var clientSecret = paymentIntent.client_secret;

      res.json({
        status: "true",
        message: "Payment initiated",
        clientSecret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
        publishableKey: "",
      });
    } catch (err) {
      console.error("Stripe payment sheet request error: ", err);
      res.json({ status: "false", message: "Internal Server Error" });
    }
  }
);

/**
 * @method post
 * @info Transaction Metadata = {name, xcf, address}
 * @info req.headers["stripe-signature"] to valid request from Stripe hook
 *
 * @header stripe-signature
 * @param body stripe payment hook object
 *
 * @dev transfer tokens to metadata.address
 **/

router.post("/stripe_hook", async function (req, res, next) {
  var sig = req.headers["stripe-signature"];

  let event;
  try {
    // Check if the event is sent from Stripe or a third party
    // And parse the event
    event = await Stripe.webhooks.varructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // Handle what happens if the event is not from Stripe
    console.log(err);
    return res.json({ status: "false", message: err.message });
  }

  // Event when a payment is succeeded
  if (event.type === "payment_intent.succeeded") {
    console.log(
      `${event.data.object.metadata.name} succeeded payment!`,
      event.data.object.metadata
    );
    var metadata = event.data.object.metadata;
    var usdAmount = metadata.amount;
    var usdPrice = await getUsdInfo();
    var xcfAmount = usdAmount / usdPrice;
    console.log("=====hook=========", metadata, metadata.address, xcfAmount);
    await doTransfer(metadata.address, xcfAmount);

    // fulfillment
    return res.json({ status: "true", message: "Okay" });
  }

  return res.json({ status: "false", message: "Unhandled action" });
});

module.exports = router;
