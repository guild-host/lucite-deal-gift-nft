// TODO: Make this a HARDHAT TASK so it can accept user params

// We have access to dotenv as hardhat config requires it
const { MINTING_CONTRACT_ADDRESS } = process.env;

async function mintLucite(
  recipientAddress,
  tokenId,
  tokenUri,
  contractAddress = MINTING_CONTRACT_ADDRESS
) {
  const GuildLuciteToken = await ethers.getContractFactory("GuildLuciteToken");
  const contract = GuildLuciteToken.attach(contractAddress);
  const transaction = await contract.safeMint(
    recipientAddress,
    tokenId,
    tokenUri
  );
  console.log("Mint transaction hash: ", transaction.hash);
  return transaction;
}

module.exports = {
  mintLucite,
};
