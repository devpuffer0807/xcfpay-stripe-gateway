var { ethers } = require("ethers");
var { baseUrl } = require("../config");
var axios = require("axios");

module.exports.doTransfer = async (address, amount) => {
  try {
    console.log(
      "==============start transfer=================",
      process.env.SERVER_MNEMONIC
    );
    var tx = await this.getTransferTransaction(address, amount);
    console.log("=tx==>", JSON.stringify(tx, undefined, 2));
    var signedTx = await this.signTransaction(tx);
    console.log("=signer==>", JSON.stringify(signer, undefined, 2));
    var response = await this.sendSignedTransaction(signedTx);
    console.log("response: ", response);
    return response.hash;
  } catch (e) {
    console.log("==============error transfer=================", e);
  }
};

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

module.exports.signTransaction = async (data) => {
  var signer = ethers.Wallet.fromMnemonic(process.env.SERVER_MNEMONIC);
  var signedData = await signer.signTransaction(data);
  return signedData;
};

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
