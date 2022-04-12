const { expect } = require("chai");
const { ethers, run } = require("hardhat");

describe("Investor minting", function () {
  it("mints Lucite Token for investor", async () => {
    // Deploy a test version of the Lucite contract
    const GuildLuciteToken = await ethers.getContractFactory(
      "GuildLuciteToken"
    );

    const deployedLuciteContract = await GuildLuciteToken.deploy();
    await deployedLuciteContract.deployed();

    await run("mint-lucite", {
      recipient: "0x7cD5d32aA6531225b8aC02a06e06BB2cC589EED2",
      id: "44",
      uri: "https://ipfs.io/ipfs/bafkreic7zsmewycfajhu5ealkp4zwj5qynvwwdrzyenzbya457wrjyf5eq",
      contract: deployedLuciteContract.address,
    });

    expect(await deployedLuciteContract.ownerOf(44)).to.equal(
      "0x7cD5d32aA6531225b8aC02a06e06BB2cC589EED2"
    );
    expect(await deployedLuciteContract.tokenURI(44)).to.equal(
      "https://ipfs.io/ipfs/bafkreic7zsmewycfajhu5ealkp4zwj5qynvwwdrzyenzbya457wrjyf5eq"
    );
  });
});
