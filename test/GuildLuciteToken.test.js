// Load dependencies
const { expect } = require("chai");
const { ethers, run } = require("hardhat");

describe("GuildLuciteToken contract", function () {
  let guildLuciteToken;
  let owner, investor, investor2;

  beforeEach(async function () {
    // Ethers provides us with a configuarable number of accounts
    // which they call signers. Each has a private, public key, as well
    // as a balance. By default all contract actions, including deployment
    // happens with the first account, making it the "owner".
    // I have named the first three accounts for clarity of intent.
    [owner, investor, investor2] = await ethers.getSigners();

    // Deploy a local instance of the contract before every test
    // to ensure tests are at all times deterministic
    guildLuciteToken = await run("deploy-lucite-contract");
  });

  it("Owner can mint new tokens and transfer to investor", async function () {
    const transaction = await guildLuciteToken.safeMint(
      investor.address,
      1,
      "https://test.com"
    );

    // Wait for the transaction to be mined, otherwise it's
    // unsafe to query our state for updated values
    await transaction.wait();

    expect(await guildLuciteToken.ownerOf(1)).to.equal(investor.address);
    expect(await guildLuciteToken.tokenURI(1)).to.equal("https://test.com");
  });

  it("Investor cannot mint new tokens and assigns ownership to investor", async function () {
    // "Connect" allows us to change the signer of our messages. By default it's the
    // owner/deployer. But what if we want our state changing methods to be called
    // by someone else? We sign the remote procedure call with their key instead.
    // const guildLuciteTokenConnectedToinvestor =
    //   guildLuciteToken.connect(investor);
    await expect(
      guildLuciteToken
        .connect(investor)
        .safeMint(investor.address, 1, "https://test.com", {
          from: investor.address,
        })
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Investor cannot transfer token to other investors", async function () {
    const transaction = await guildLuciteToken.safeMint(
      investor.address,
      1,
      "https://test.com"
    );
    await transaction.wait();

    const connectedToInvestor = await guildLuciteToken.connect(investor);

    // Below we need to use this odd square brack syntax instead of calling
    // contract.safeTransferFrom() in a normal way as ethers has no way of knowing
    // how to deal with polymorphic functions
    await expect(
      connectedToInvestor["safeTransferFrom(address,address,uint256)"](
        investor.address,
        investor2.address,
        1
      )
    ).to.be.revertedWith(
      "GuildLucite: Lucites cannot be transferred to third parties"
    );
  });

  it("Investor cannot transfer token back to contract", async function () {
    // This is important as contracts that can receive tokens can get them
    // "stuck". We cannot transfer them out without creating new override functions
    // as "safeTransfer()" in the public ABI checks to see if it is the owner of the
    // token (or approved) making the call. In this case, the contract would have to
    // call the "safeTransfer" on itself (not implemented in standard) or approve an
    // outside account on itself. While we could make functionality in this manner,
    // it creates an attack surface for "unwanted organic token misplacement".
    const mintTransaction = await guildLuciteToken.safeMint(
      investor.address,
      1,
      "https://test.com"
    );

    await mintTransaction.wait();

    const connectedToInvestor = await guildLuciteToken.connect(investor);

    // Below we need to use this odd square brack syntax instead of calling
    // contract.safeTransferFrom() in a normal way as ethers has no way of knowing
    // how to deal with polymorphic functions

    await expect(
      connectedToInvestor["safeTransferFrom(address,address,uint256)"](
        investor.address,
        guildLuciteToken.address,
        1
      )
    ).to.be.revertedWith(
      "GuildLucite: Lucites cannot be transferred to third parties"
    );
  });

  it("Investor can transfer token back to owner", async function () {
    const mintTransaction = await guildLuciteToken.safeMint(
      investor.address,
      1,
      "https://test.com"
    );

    await mintTransaction.wait();

    const connectedToInvestor = await guildLuciteToken.connect(investor);

    const transferTransaction = await connectedToInvestor[
      "safeTransferFrom(address,address,uint256)"
    ](investor.address, owner.address, 1);

    transferTransaction.wait();

    expect(await guildLuciteToken.ownerOf(1)).to.equal(owner.address);
  });

  it("Owner can transfer token back investor", async function () {
    const mintTransaction = await guildLuciteToken.safeMint(
      owner.address,
      1,
      "https://test.com"
    );

    await mintTransaction.wait();

    const transferTransaction = await guildLuciteToken[
      "safeTransferFrom(address,address,uint256)"
    ](owner.address, investor.address, 1);

    transferTransaction.wait();

    expect(await guildLuciteToken.ownerOf(1)).to.equal(investor.address);
  });

  it("Owner can transfer returned token to new investor address", async function () {
    const mintTransaction = await guildLuciteToken.safeMint(
      investor.address,
      1,
      "https://test.com"
    );

    await mintTransaction.wait();

    const connectedToInvestor = await guildLuciteToken.connect(investor);

    const transferToOwnerTransaction = await connectedToInvestor[
      "safeTransferFrom(address,address,uint256)"
    ](investor.address, owner.address, 1);

    await transferToOwnerTransaction.wait();

    const transferToSecondInvestorTransaction = await guildLuciteToken[
      "safeTransferFrom(address,address,uint256)"
    ](owner.address, investor2.address, 1);

    await transferToSecondInvestorTransaction.wait();

    expect(await guildLuciteToken.ownerOf(1)).to.equal(investor2.address);
  });
});
