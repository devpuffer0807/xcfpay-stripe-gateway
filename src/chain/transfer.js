/**
 * @dev Blockchain transfer API
 * @author Puffer
 **/

var { ethers } = require("ethers");
var { baseUrl } = require("../config");
var axios = require("axios");

/**
 * @param toAddress token receiver address
 * @param amount xcf token transfer amount
 * @dev transfer `amount` xcf token to `toAddress`
 **/
module.exports.doTransfer = async (toAddress, amount) => {
  try {
    console.log(
      "==============start transfer=================",
      process.env.SERVER_MNEMONIC
    );
    var tx = await this.getTransferTransaction(toAddress, amount);
    console.log("=tx==>", JSON.stringify(tx, undefined, 2));
    var signedTx = await this.signTransaction(tx);
    console.log(
      "=signer==>",
      JSON.stringify(process.env.SERVER_WALLET_ADDRESS, undefined, 2)
    );
    var response = await this.sendSignedTransaction(signedTx);
    console.log("response: ", response);
    return response.hash;
  } catch (e) {
    console.log("==============error transfer=================", e);
  }
};

/**
 * @param toAddress token receiver address
 * @param amount token amount
 * @dev get transfer transaction
 **/
module.exports.getTransferTransaction = async (toAddress, amount) => {
  return axios({
    method: "get",
    url: `${baseUrl}/xcf/tx/transfer?from=${process.env.SERVER_WALLET_ADDRESS}&to=${toAddress}&amount=${amount}&unit=ether`,
    headers: {
      "Content-type": "application/json",
    },
  })
    .then((response) => {
      console.log("Get transfer tx data response:", response.data);
      return response.data;
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

/**
 * @param data transaction data
 * @dev sign transaction with server wallet
 **/
module.exports.signTransaction = async (data) => {
  var signer = ethers.Wallet.fromMnemonic(process.env.SERVER_MNEMONIC);
  var signedData = await signer.signTransaction(data);
  return signedData;
};

/**
 * @param data signed transaction data
 * @dev send signed transaction
 **/
module.exports.sendSignedTransaction = async (data) => {
  return axios({
    method: "post",
    url: `${baseUrl}/xcf/tx`,
    headers: {
      "Content-type": "text/plain",
    },
    data,
  }).then((response) => {
    console.log("Send signed tx response:", response.data);
    return response.data;
  });
};
