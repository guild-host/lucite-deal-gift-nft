async function deployLuciteContract() {
  const GuildLuciteToken = await ethers.getContractFactory("GuildLuciteToken");
  console.log("Deploying GuildLuciteToken...");
  const guildLuciteToken = await GuildLuciteToken.deploy();
  await guildLuciteToken.deployed();
  console.log("GuildLuciteToken deployed to:", guildLuciteToken.address);
  return guildLuciteToken;
}

module.exports = {
  deployLuciteContract,
};
