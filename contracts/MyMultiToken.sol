// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";

/**
 * @title MyMultiToken
 * @dev A simple ERC1155 multi-token contract with minting capabilities
 */
contract MyMultiToken is ERC1155URIStorage, Ownable {
    uint256 public constant GOLD = 0;
    uint256 public constant SILVER = 1;
    uint256 public constant BRONZE = 2;

    constructor() ERC1155("") Ownable(msg.sender) {
        _setURI(GOLD, "https://example.com/gold.json");
        _setURI(SILVER, "https://example.com/silver.json");
        _setURI(BRONZE, "https://example.com/bronze.json");
    }

    /**
     * @dev Mint tokens of a specific type to an address
     * @param to Address to mint tokens to
     * @param id Token ID (0=Gold, 1=Silver, 2=Bronze)
     * @param amount Amount of tokens to mint
     * @param data Additional data
     */
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyOwner {
        _mint(to, id, amount, data);
    }

    /**
     * @dev Batch mint multiple token types to an address
     * @param to Address to mint tokens to
     * @param ids Array of token IDs
     * @param amounts Array of amounts for each token ID
     * @param data Additional data
     */
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }

    /**
     * @dev Get balance of a specific token type for an address
     * @param account Address to check balance for
     * @param id Token ID
     * @return Balance of the token type
     */
    function getBalance(address account, uint256 id) public view returns (uint256) {
        return balanceOf(account, id);
    }

    /**
     * @dev Get total supply of a specific token type
     * @param id Token ID
     * @return Total supply (this is a simplified version, actual total supply tracking would require additional state)
     */
    function getTotalSupply(uint256 id) public pure returns (uint256) {
        // Note: ERC1155 doesn't have a built-in totalSupply
        // In a production contract, you'd track this separately
        require(id >= 0 && id <= 2, "Invalid token ID");
        return type(uint256).max; // Placeholder
    }
}

