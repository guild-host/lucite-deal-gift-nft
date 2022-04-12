# Guild Lucite Deal Gift

This project seeks to provide a [Lucite Deal Gift](https://en.wikipedia.org/wiki/Deal_toy) on the Ethereum blockchain.

Lucite Deal Gifts are provided to commemorate large deals or investments, essentially as a desk ornament. No different than a trophy, but for excel types. Guild wishes to provide a NFT to investors commemorating our [soulbound](https://vitalik.ca/general/2022/01/26/soulbound.html) journey together.

NFTs are a strong technology fit for this purpose as each toy is unique and can be linked to an art piece the investor can display on various digital platforms. It's hard to keep your collection of Lucite Deal Gifts in your office's boardrooms.

The one minor deviation we are implementing from the [ERC-721 NFT standard](https://eips.ethereum.org/EIPS/eip-721) is restricting transfers. It feels odd to allow anyone to trade for these Lucite Deal Gifts, as it does not confer any actual ownership of the Guild corporation itself. As a result, we have added logic to prevent transfers in ways that are not allowed.

This project firmly leverages [OpenZeppelin's (Oz) preset contracts](https://docs.openzeppelin.com/contracts/4.x/api/token/erc721). This provides much additional functionality beyond the base ERC-721 standard for "free" including,

- Ability to pause token activity
- Ability to burn tokens
- Ability to add token metadata
- Ability to restrict certain parts of the ABI to the contract owner

As these pieces of functionality are inherited from a swath of base contracts, **it requires the developer to be aware of all the base classes being used to fully understand the flow of logic**. I would strongly advise any developer to read, and understand, all these contracts in full before attempting to make any changes. Remember, there is no undo for some operations, and operations can cost a lot of ether.

## What is a token? What is a token contract?

Much misunderstanding of tokens stems from confusion around _token contracts_ vs _tokens_. A token contract is an Ethereum smart contract, which holds ownership and balances of these tokens. These balances represent the _tokens_ themselves. Someone "has tokens" when their balance in the token contract is non-zero.

It's important to understand the tokens never "leave" the contract. Transfers between two addresses move the token from one address to another in the contract's internal hashmap-like table. Minting creates a new token for non-fungible scenarios, which can be reduced to a new token ID. This is then attached as a value to a particular address. Once this is understood NFT contracts will be much less intimidating.

For example, see [this inmplementation](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/ERC721.sol#L280) of a `_mint` method by a popular of base contracts, OpenZeppelin.

```solidity
function _mint(address to, uint256 tokenId) internal virtual {
    require(to != address(0), "ERC721: mint to the zero address");
    require(!_exists(tokenId), "ERC721: token already minted");

    _beforeTokenTransfer(address(0), to, tokenId);

    // tokenId can be whatever we want
    _balances[to] += 1; // Increment number of tokens owned by an address
    _owners[tokenId] = to; // Big hash table where we can may token (key) to owners (value)

    emit Transfer(address(0), to, tokenId);

    _afterTokenTransfer(address(0), to, tokenId);
}
```

## Development

This project uses [Hardhat](https://hardhat.org/) as a development environment. It provides JavaScript tooling to compile, deploy, test, and debug your Ethereum software, in a familiar Node.js ecosystem.

#### Getting started

Let's get blockchaining!

1. `git clone` this repository
2. Ensure you have Node.js installed
3. `npm i` to install all the packages
4. Make a `.env` file with the same variables as `.env.example`. `cp .env.example .env` will do the job on unix systems.

Great! Now you have everything you need to compile the contract, and even run tests against a local chain.

Hardhat has a key commands to help you along

- `npx hardhat compile` Compiles the current contract for deployment
- `npx hardhat node` Runs a persistent localhost chain (run in separate terminal).
- `npx hardhat test` (shorthand: `npm t`) Runs all tests against ephemeral local chain instances
- `npx hardhat console` Allows realtime interaction with chains and contracts

## Testing

There is a large and disparate array of testing options. After trialling a few, I have settled on `mocha`, `chai`, `waffle`, `ethers`, and `hardhat`. I will detail the purpose of each package below.

- Mocha: Test runner, runs the test in the `/test` foler
- Chai: Common javascript test assertions
- Waffle: Library for testing smart contrats. Provides Smart Contract specific assertions and other helpers
- Hardhat: Our development framework. It manages a blockchain and provides a deploy mechanism for each test

You can run tests with `npm t`, but under the surface it's really doing `npx hardhat test`.

## Access Control

OpenZeppelin provides a number of contracts that provide access control, including `Ownable`, and a`AccessControl`. We only use `Ownable` at this time, which means all "admin" powers, such

## Deployment

There are small differences in requirements for local networks and remote (test and main) networks.

### Local networks

We can deploy and observe the deployment of the contract with the following two commands.

- `npx hardhat node` in a separate tab instantiate a persistent local chain
- `npx hardhat deploy-lucite-contract --network localhost`

Now checking on the chain tab, you should see the contract transaction. Well done! The contract will persist until the `npx hardhat node` process is stopped. You can see other commands in action too. If you took note of the deployed contract's address you can, for example, run a mint task.

```bash
npx hardhat mint-lucite --recipient 0x7cD5d32aA6531225b8aC02a06e06BB2cC589EED2 --id 12345 --uri  https://ipfs.io/ipfs/bafkreicozitpbf4xppy2xoeeuiool56664l2vpju6ndgmzp4yum6kzorcu --contract 0x5fbdb2315678afecb367f032d93f642f64180aa3 --network localhost
```

You can further explore and manipulate entities on the chain through using the `npx hardhat console`, which is mentioned in detail later in this document.

### Test networks

There are four main test networks, with many being "proof of authority" for speed and convenience of blocks. This project has been developed primarily against the Rinkeby test network thus far.

To deploy on Rinkeby, this environment will deploy using a public/private key generated from the mnemonic found in the `hardhat.config.js` file, meaning all deployments, and ownership of contracts will be consistent on this test network.

##### Deployment onto Test Networks

The deployment account is generated from a mnemonic that needs to exist in the `.env` file. This will allow consistent accounts to be used for deployment, ownership and holding of ether. You can ask the team for the group mnemonic or generate your own with:

```bash
npx mnemonics
```

All deployments and transactions have a cost that must be paid for it to succeed, therefore it's important for this mnemonic account to have some ether. Transactions are, broadly, non-read only actions. Careful! Some seemingly read only functions may, for example, emit events, and therefore cost gas.

If it's running low, please use one of the Rinkeby faucets. Google may be your best bet, as they seem a little tempermental/over subscribed.

You will also need an [alchemy API URL](https://www.alchemy.com/) for Rinkeby. Alchemy acts as the "bridge" through which we route our eventual remote procedure calls (RPCs) to the blockchain.

To deploy, run:

```bash
npx hardhat deploy-lucite-contract --network rinkeby
```

After a few moments you should have the address of the deployed Lucite Token contract. If you are deploying this to a persistent chain, you may put this address into your `.env` for future repeated uses, such as minting.

##### Minting

Before pushing a token to the blockchain, the groundwork of the artwork asset must be done. Ensure the asset is uploaded to an IPFS service such as [Pinata](https://www.pinata.cloud/). Once complete, metadata must also be uploaded to the IPFS service. An example can be seen in the `nft-metadata.json.example` file. The image field of the metadata should be pointing to the initial asset upload.

It is worth noting that minting requires _gas_, as this is a write operation this cost, paid in ether, must come from the account creating the transaction. For example, if Alice requests the Contract mints a Lucite Token for Bob, Alice must have sufficient ether in wallet. The amount required shifts like the sands of time levitated on an air hockey table. It is worthwhile to look at today's rates and extrapolate costs up front, if money is an object. Running `npm t` will produce a "gas report" that will provide guidance.

###### Single mints

Once the `metadata.json` file has been uploaded, and you have its content identifier (CID), we are ready to mint! A hardhat task has been made to do this conveniently. You can see all available tasks with `npx hardhat`, but we'll be using `npx hardhat mint-lucite`. It takes a number of arguments, the recipient wallet address, the ID the Lucite Token should have (must not have been minted previously!) and the URI of a gateway allowing HTTPS access to IPFS. We tend to use `https://ipfs.io/ipfs/<CID>`. There is a fourth optional argument, the contract address, which will by default take the `MINTING_CONTRACT_ADDRESS` from .env. This is provided as a convinience as we will consistently work with the same contracts - at least on mainnet.

```bash
npx hardhat mint-lucite --recipient 0x7cD5d32aA6531225b8aC02a06e06BB2cC589EED2 --id 12345 --uri  https://ipfs.io/ipfs/bafkreicozitpbf4xppy2xoeeuiool56664l2vpju6ndgmzp4yum6kzorcu --network rinkeby
```

The final argument, the `--network`, can be used with any task. Here we're attempting a remote procedure call on the rinkeby network. If no argument is provided, the local test chain will be used.

###### Batch mints

We can mint from a CSV which dictates the tokenID and address, the CID of the Lucite's still image, and the CID of the Lucite's animation. An example is provided in the root of the project, `investors_to_batch_mint.example.csv`. A task has been provided to reduce the need to juggle scripts manually. A relative path from the project root must be supplied with the `--csv` parameter, and as above an optinoal `contract` parameter has been included to allow flexibility in calling separate contracts.

```bash
npx hardhat mint-lucites-from-csv --csv ./investors_to_batch_mint.csv --network rinkeby
```

This mints tokens sequentially following a [one-piece-flow](https://getbreakout.com/blog/what-is-one-piece-flow/) approach, to mitigate some risk of costly batch errors. Note that as each transaction is waited upon until mined, meaning for larger numbers and gas strategy, this script may take a long time to run.

## Console

We can test out reading and transactions using the `hardhat console`. This works for any net - this example we will use the local chain.

- `npx hardhat node` in a separate tab instantiate a persistent chain
- `npx hardhat console --network localhost` Opens the console only the above chain

From there we can "attach" the contract and interact with it in a JS fashion.

```js
const Contract = await ethers.getContractFactory("GuildLuciteToken");
// Make sure this address is the same as the one returned upon deployment.
const contract = await Contract.attach(
  "0x5FbDB2315678afecb367f032d93F642f64180aa3"
);

// Call a read function on the contract
await contract.owner();
// '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'

// Call a write function
await contract.safeMint(
  0x5fbdb2315678afecb367f032d93f642f64180aa3,
  1,
  `https://ipfs.io/ipfs/bafkreicvylv3apwfcpamsaz72ovfyahj5jzeylvnvk56n7h4qehoqzysrq`
);
// Transact hash { ...}

// For uint256 JS falters due to size, so we can
(await contract.method()).toString();
```

The hardhat `scripts/index.js` and other JS files can be used to automate some behaviour via the `ethers` npm package.

```bash
npx hardhat run --network localhost scripts/index.js
```
