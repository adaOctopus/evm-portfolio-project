// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// {} \ x / > < = > "" + & *×  # $ }{| /``@
// Symbols Keyboard Broken
// {} \ x / > < = > "" + & *×  # $ }{| /`` () ?  _ []
// Contract Address after deployment
// 


/**
 * @title MyToken
 * @dev A simple ERC20 token contract with minting capabilities
 */
contract MyToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18; // 1 million tokens with 18 decimals

    event Withdraw(address indexed to, uint256 amount); 

    constructor() ERC20("MyToken", "MTK") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    /**
     * @dev Mint new tokens to a specified address
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Get total supply of tokens
     * @return Total supply
     */
    function getTotalSupply() public view returns (uint256) {
        return totalSupply();
    }

    /**
     * @dev Get balance of an address
     * @param account Address to check balance for
     * @return Balance of the address
     */
    function getBalance(address account) public view returns (uint256) {
        return balanceOf(account);
    }

    function withdraw() public onlyOwner returns (uint256 amount) {
        payable(owner()).transfer(address(this).balance);
        emit Withdraw(owner(), address(this).balance);
        amount = msg.sender.balance;
        return amount;
    }
}

