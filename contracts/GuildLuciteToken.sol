// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

/// @custom:security-contact security@guild.host
contract GuildLuciteToken is
    ERC721,
    ERC721URIStorage,
    Pausable,
    Ownable,
    ERC721Burnable
{
    constructor() ERC721("Guild Lucite", "GUILD") {}

    // This will allow us to pause all transfer and minting activites
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(
        address to,
        uint256 tokenId,
        string memory uri
    ) public onlyOwner {
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override whenNotPaused {
        // All newly minted tokens use the transfer function
        // but the from address is conventionally
        // 0x0000000000000000000000000000000000000000
        // We also want the owner to be able to transfer tokens
        // to anyone. This is an administration out in case, for example
        // the same investor wants to move their lucite between wallets
        // If this expands any more, CONSIDER USING A MAPPING
        // e.g mapping(address => bool) _allowedToTrransfer;
        if (!(from == address(0) || from == this.owner())) {
            // If it's not a freshly minted token, and the sender
            // is not the owner, it must be heading _to_ the owner
            require(
                to == this.owner(),
                "GuildLucite: Lucites cannot be transferred to third parties"
            );
        }
        super._beforeTokenTransfer(from, to, tokenId);
    }

    // The following functions are overrides required by Solidity.
    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
