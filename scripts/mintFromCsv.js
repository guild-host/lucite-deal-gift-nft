const fs = require("fs");
const path = require("path");
const csv = require("fast-csv");
const pinataSDK = require("@pinata/sdk");
const { PINATA_API_KEY, PINATA_API_SECRET } = process.env;
const web3 = require("web3");
const multiformats = require("multiformats");
const { mnemonicToSeed } = require("ethers/lib/utils");

const pinata = pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);

const DESCRIPTION = `Thank you for being part of our journey with Guild!

This Lucite Deal Gift digitally commemorates our journey together. It's a modernization on the old concept of Lucite Deal Gifts, often found within the boardrooms of companies as a trophy of a past deal. At Guild, we're reimagining old dynamics and changing the narrative for the better - in order to elevate communities across geographies. The re-imagination of this old Lucite concept into something new is representative of our exploration of pushing boundaries in ways that are both innovative and relevant. We will continue to seek new opportunities to benefit communities and the people within them.

The artwork was created by digital artist Fabricio Rosa Marques. It is inspired by a "school of fish, as eggs" to represent the knowledge-transfer aspect of communities on Guild as well as the infancy of participation within the Pre-Seed round. Fabricio used various techniques to capture that inspiration within the motion and refraction of this piece.

Marcel Cutts worked on the smart contract itself. He explored various technologies before settling on the Ethereum blockchain and tooling to best accommodate the non-transferability characteristic of this NFT. Being able to restrict transfers on the ERC721 spec where transference is built-in required innovative structuring of various aspects of the delivery of this piece.

This Lucite Deal Gift is issued specifically to wallets associated with authorized individuals. Holders of this Lucite Deal Gift are unable to transfer it to an address other than that associated with the guildhost.eth ENS address. Any transfer from that Guild-controlled address onwards would require an appropriate reason to be provided (e.g. changing of wallet addresses for the same individual). This Lucite Deal Gift is nothing more than a commemorative gift in recognition of a past deal. It is not a security as it is not an asset (it holds no value) and is not tradeable.`;

function readInvestorCsv(relativeCsvPath) {
  return new Promise((resolve, reject) => {
    const rows = [];

    // This will be run from the root of the project so let's
    // anchor it there so relative file traversal intuition.
    // `process.cwd()` is an option here but has its own trade-offs
    fs.createReadStream(path.resolve(__dirname, "..", relativeCsvPath))
      .pipe(
        csv.parse({
          headers: true,
          strictColumnHandling: true,
          ignoreEmpty: true,
        })
      )
      .validate((row, cb) => {
        let errors = [];

        if (!web3.utils.isAddress(row.address)) {
          errors.push("Invalid Ethereum Address");
        }

        try {
          multiformats.CID.parse(row.imageCid);
        } catch (error) {
          errors.push(`Invalid image CID: ${error}`);
        }

        try {
          multiformats.CID.parse(row.animationCid);
        } catch (error) {
          errors.push(`Invalid animation CID: ${error}`);
        }

        if (errors.length > 0) {
          const errorMessages = errors.join("\n ");
          return cb(null, false, errorMessages);
        }

        return cb(null, true);
      })
      .on("error", (error) => reject(error))
      .on("data", (row) => rows.push(row))
      .on("data-invalid", (row, rowNumber, reason) =>
        reject(
          new Error(
            `💥 Invalid Row [rowNumber=${rowNumber}] [row=${JSON.stringify(
              row
            )}] \n Reasons: \n ${reason}`
          )
        )
      )
      .on("end", () => {
        resolve(rows);
      });
  });
}

function generateInvestorMetadata({ tokenId, imageCid, animationCid }) {
  return {
    attributes: [
      {
        trait_type: "Round",
        value: "Pre-Seed",
      },
    ],
    description: DESCRIPTION,
    image: `https://ipfs.io/ipfs/${imageCid}`,
    background_color: "5632E4",
    name: `Guild Lucite #${tokenId}`,
    animation_url: `https://ipfs.io/ipfs/${animationCid}`,
    tokenId: parseInt(tokenId, 10),
  };
}

async function pinMetadataJsonOnIpfs(metadata, options) {
  try {
    const response = await pinata.pinJSONToIPFS(metadata, {
      pinataOptions: { cidVersion: 1 },
      ...options,
    });
    return response;
  } catch (error) {
    console.log(error);
  }
}

async function mintInvestorTokensFromCsv(
  csvFilepath = "./investor_minting.csv",
  luciteContractAddress = process.env.MINTING_CONTRACT_ADDRESS
) {
  // Read investor position, address, and image content identifier
  const investors = await readInvestorCsv(csvFilepath);

  // Generate token
  const GuildLuciteToken = await ethers.getContractFactory("GuildLuciteToken");

  const contract = GuildLuciteToken.attach(luciteContractAddress);

  // Using a one-piece-flow approach from here on
  // out to redcuce possible errors on a batch scale.
  for (let investor of investors) {
    // If token already minted, skip. This allows us to
    // "resume" minting from a very big list. Sadly a
    // "token exists" function is not part of the ERC721 spec
    // so we're sadly controlling flow via exception thrown
    // from ".ownerOf(tokenId)", as should a token not be claimed,
    // an exception is thrown.
    try {
      await contract.ownerOf(investor.tokenId);
      console.warn(
        `⏩ Lucite Token ${investor.tokenId} already asigned to investor at address ${investor.addres}. Skipping to next investor.`
      );
      continue;
    } catch {
      // Do nothing as if they token has no owner we can continue.
      // Yeah I know.
      console.info(
        `✅ Lucite Token ${investor.tokenId} not yet assigned. Continuing...`
      );
    }

    // Generate investor metadata which will include items like
    // links to media and some custom attributes.
    const investorMetadata = generateInvestorMetadata(investor);
    const options = {
      pinataMetadata: {
        name: "PreSeed" + investorMetadata.tokenId,
      },
      pinataOptions: {
        cidVersion: 1,
      },
    };
    console.info(`🔧 Lucite Token ${investor.tokenId} metadata generated`);

    // Pin to IPFS to ensure the files will persist
    const investorMetadaIpfs = await pinMetadataJsonOnIpfs(
      investorMetadata,
      options
    );
    console.info(
      `🚀 Lucite Token ${investor.tokenId} metadata pinned to pinata.`
    );

    const mintTransaction = await contract.safeMint(
      investor.address,
      investor.tokenId,
      `https://ipfs.io/ipfs/${investorMetadaIpfs.IpfsHash}`
    );

    // Waits for the mint transaction to be successfully mined
    // TODO: Do we worry about timeout? Both from node and ethers js
    // https://github.com/ethers-io/ethers.js/issues/945
    console.log(
      `📦️ Lucite Token ${investor.tokenId} minted. Waiting for block transaction...`
    );
    await mintTransaction.wait();
    console.log(
      `🚚 Lucite Token ${investor.tokenId} delivered to ${investor.address}!`
    );
  }
}

module.exports = {
  readInvestorCsv,
  generateInvestorMetadata,
  pinMetadataJsonOnIpfs,
  mintInvestorTokensFromCsv,
};
