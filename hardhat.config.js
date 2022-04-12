require("dotenv").config();

require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
const deploy = require("./scripts/deploy");
const mint = require("./scripts/mint");
const mintFromCsv = require("./scripts/mintFromCsv");

const {
  ALCHEMY_RINKEBY_URL,
  ALCHEMY_MAINNET_URL,
  MAINNET_PRIVATE_KEY,
  MNEMONIC,
  COINMARKET_CAP_API_KEY,
} = process.env;

task("deploy-lucite-contract", "Deploy the Lucite Token contract").setAction(
  async () => {
    return await deploy.deployLuciteContract();
  }
);

task("mint-lucite", "Mint a single Lucite token")
  .addParam("recipient", "Address of the Lucite recipient")
  .addParam("id", "ID the token will be given. Must not be already assigned!")
  .addParam("uri", "URI pointing to the metadata JSON associated with token")
  .addOptionalParam(
    "contract",
    "Address of the deployed contract that performs minting. Defaults to value set in .env"
  )
  .setAction(async ({ recipient, id, uri, contract }) => {
    await mint.mintLucite(recipient, id, uri, contract);
  });

task("mint-lucites-from-csv", "Mint Lucite Tokens in batch from a CSV")
  .addParam("csv", "Path to the CSV file")
  .addOptionalParam(
    "contract",
    "Address of the deployed contract that performs minting. Defaults to value set in .env"
  )
  .setAction(async ({ csv, contract }) => {
    await mintFromCsv.mintInvestorTokensFromCsv(csv, contract);
  });

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    token: "ETH",
    gasPriceApi:
      "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    coinmarketcap: COINMARKET_CAP_API_KEY,
  },
  networks: {
    mainnet: {
      url: ALCHEMY_MAINNET_URL,
      accounts: [`${MAINNET_PRIVATE_KEY}`],
    },
    rinkeby: {
      url: ALCHEMY_RINKEBY_URL,
      accounts: { mnemonic: MNEMONIC },
    },
  },
};
