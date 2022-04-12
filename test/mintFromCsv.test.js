const { expect } = require("chai");
const mintFromCsv = require("../scripts/mintFromCsv");
const { run } = require("hardhat");

const DESCRIPTION = `Thank you for being part of our journey with Guild!

This Lucite Deal Gift digitally commemorates our journey together. It's a modernization on the old concept of Lucite Deal Gifts, often found within the boardrooms of companies as a trophy of a past deal. At Guild, we're reimagining old dynamics and changing the narrative for the better - in order to elevate communities across geographies. The re-imagination of this old Lucite concept into something new is representative of our exploration of pushing boundaries in ways that are both innovative and relevant. We will continue to seek new opportunities to benefit communities and the people within them.

The artwork was created by digital artist Fabricio Rosa Marques. It is inspired by a "school of fish, as eggs" to represent the knowledge-transfer aspect of communities on Guild as well as the infancy of participation within the Pre-Seed round. Fabricio used various techniques to capture that inspiration within the motion and refraction of this piece.

Marcel Cutts worked on the smart contract itself. He explored various technologies before settling on the Ethereum blockchain and tooling to best accommodate the non-transferability characteristic of this NFT. Being able to restrict transfers on the ERC721 spec where transference is built-in required innovative structuring of various aspects of the delivery of this piece.

This Lucite Deal Gift is issued specifically to wallets associated with authorized individuals. Holders of this Lucite Deal Gift are unable to transfer it to an address other than that associated with the guildhost.eth ENS address. Any transfer from that Guild-controlled address onwards would require an appropriate reason to be provided (e.g. changing of wallet addresses for the same individual). This Lucite Deal Gift is nothing more than a commemorative gift in recognition of a past deal. It is not a security as it is not an asset (it holds no value) and is not tradeable.`;

describe("Investor batch minting", function () {
  it("Returns object representation of investor token IDs and addresses from CSV", async function () {
    const readInvestors = await mintFromCsv.readInvestorCsv(
      "./test/test_mint.csv"
    );
    const expectedInvestors = [
      {
        tokenId: "1",
        address: "0x7cD5d32aA6531225b8aC02a06e06BB2cC589EED2",
        animationCid: "QmdgWKBNYn9q1HU8wiRv1NYxkJEFMRsUaDwNHMH1DqYgEM",
        imageCid: "QmeTkDQ18hpqU6CKFZbHK7zL1steqdoMfqoasF2QUPU5g4",
      },
      {
        tokenId: "2",
        address: "0x1E5F187187A625A4EcdDb24cD54463742dD34024",
        animationCid: "QmTKE8VTAcy2axUUC2hpuhsvPQZ2tySemeQwFByQ8AzUw3",
        imageCid: "Qmehv9WE1EpHMCVead1aRuEMzhBnDoQXZzYThtXhR1kyaH",
      },
    ];

    // `eql` is a chai shorthand for deep equal as found in the
    // deep-eql-project https://github.com/chaijs/deep-eql
    expect(readInvestors).to.eql(expectedInvestors);
  });

  it("Throws an exception with detailed errors if given an invalid address or CIDs ", async () => {
    try {
      await mintFromCsv.readInvestorCsv("./test/test_mint_invalid.csv");
    } catch (error) {
      expect(error.message).to.equal(
        `💥 Invalid Row [rowNumber=2] [row={"tokenId":"2","address":"0x1E5F187187A625A4EcdDb24cdfdfD54463742dD34024","imageCid":"Qmehv9WE1EpHMCVead1aRuEMzhBDoQXZzYThtXhR1kyaH","animationCid":"QmTKE8VTAcy2axUUC2hpuhsvPQZ2tySemeQwFByQ8AzUw32"}]${" "}
 Reasons:${" "}
 Invalid Ethereum Address
 Invalid image CID: RangeError: Invalid CID version 80
 Invalid animation CID: RangeError: Invalid CID version 4`
      );
    }
  });

  it("Generates expected metadata from investor", async function () {
    const generatedMetadata = await mintFromCsv.generateInvestorMetadata({
      tokenId: "1",
      address: "0x7cD5d32aA6531225b8aC02a06e06BB2cC589EED2",
      imageCid: "Qmehv9WE1EpHMCVead1aRuEMzhBnDoQXZzYThtXhR1kyaH",
      animationCid: "QmTKE8VTAcy2axUUC2hpuhsvPQZ2tySemeQwFByQ8AzUw3",
    });
    const expectedMetadata = {
      attributes: [
        {
          trait_type: "Round",
          value: "Pre-Seed",
        },
      ],
      description: DESCRIPTION,
      image:
        "https://ipfs.io/ipfs/Qmehv9WE1EpHMCVead1aRuEMzhBnDoQXZzYThtXhR1kyaH",
      animation_url:
        "https://ipfs.io/ipfs/QmTKE8VTAcy2axUUC2hpuhsvPQZ2tySemeQwFByQ8AzUw3",
      background_color: "5632E4",
      name: "Guild Lucite #1",
      tokenId: 1,
    };

    expect(generatedMetadata).to.eql(expectedMetadata);
  });

  // We should split these final two tests out as it requires
  // external platforms and is as such much more of an integration test
  describe("Integration", function () {
    it("Pins JSON for Investor Lucite on IPFS", async function () {
      // Skip this test if no pinata API provided
      if (!process.env.PINATA_API_KEY) {
        this.skip();
      }

      const metadata = {
        attributes: [
          {
            trait_type: "Round",
            value: "Pre-Seed",
          },
        ],
        description: DESCRIPTION,
        image:
          "https://ipfs.io/ipfs/QmUPqNRJepN4nvap3qRHHine68KBkt8aqPF2ukEpirMJEG",
        animation_url:
          "https://ipfs.io/ipfs/QmdgWKBNYn9q1HU8wiRv1NYxkJEFMRsUaDwNHMH1DqYgEM",
        background_color: "5632E4",
        name: "Guild Lucite #7357",
        tokenId: 7357,
      };

      const options = {
        pinataMetadata: {
          name: "PreSeed" + metadata.tokenId,
        },
        pinataOptions: {
          cidVersion: 1,
        },
      };

      const response = await mintFromCsv.pinMetadataJsonOnIpfs(
        metadata,
        options
      );

      expect(response.IpfsHash).to.equal(
        "bafkreigljcxmbfm7mac6d63ic7j74wla6csk2mnvu6gut2mdhsffg42iky"
      );
    });

    it("mints Lucite Tokens for investors in CSV", async function () {
      if (!process.env.PINATA_API_KEY) {
        this.skip();
      }

      // Deploy a test version of the Lucite contract
      const deployedLuciteContract = await run("deploy-lucite-contract");

      await run("mint-lucites-from-csv", {
        csv: "./test/test_mint.csv",
        contract: deployedLuciteContract.address,
      });

      expect(await deployedLuciteContract.ownerOf(1)).to.equal(
        "0x7cD5d32aA6531225b8aC02a06e06BB2cC589EED2"
      );

      expect(await deployedLuciteContract.ownerOf(1)).to.equal(
        "0x7cD5d32aA6531225b8aC02a06e06BB2cC589EED2"
      );
      expect(await deployedLuciteContract.tokenURI(1)).to.equal(
        "https://ipfs.io/ipfs/bafkreiario54qi4fhjnuw2kd67wd2myyn5ihpjbdgbbmlf3xpmloto2c4i"
      );
      expect(await deployedLuciteContract.ownerOf(2)).to.equal(
        "0x1E5F187187A625A4EcdDb24cD54463742dD34024"
      );
      expect(await deployedLuciteContract.tokenURI(2)).to.equal(
        "https://ipfs.io/ipfs/bafkreibs3elqb64tdsdsxin3vn3kltsoglw62jxz2gvndkk2fibvky5ity"
      );
    });
  });
});
