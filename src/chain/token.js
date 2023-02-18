/**
 * @author Puffer
 **/

var axios = require("axios");

/**
 * @dev get usd rate in xcf
 **/
module.exports.getUsdInfo = async () => {
  return axios({
    method: "get",
    url: `https://api.xcfpay.app/rate/usd`,
    headers: {
      "Content-type": "application/json",
    },
  })
    .then((response) => {
      console.log("Get usd info data response:", response.data);
      return response.data;
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
};
