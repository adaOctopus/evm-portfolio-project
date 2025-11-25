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

contract TToken is ERC20, Ownable, ReentrancyGuard {

    uint256 public constant INITIAL_SUPPLY = 3000000 * 10**18; // 1 million tokens with 18 decimals
    mapping (address => uint256) public balances;

    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event Received(address indexed from, uint256 amount);
    constructor() ERC20("TToken", "TTK") Ownable(msg.sender) {
        // Mint the initial supply to the owner
        _mint(msg.sender, INITIAL_SUPPLY);
        emit Mint(msg.sender, INITIAL_SUPPLY);
    }

    function getBalance() public view returns (uint256) {
        uint256 amount = balances[msg.sender];
        return amount;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        emit Mint(to, amount);
    }

    function getTotalSupply() public view returns (uint256) {
        return totalSupply();
    }

    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
        emit Burn(from, amount);
    }

    receive() external payable {
        balances[msg.sender] += msg.value;
        emit Received(msg.sender, msg.value);
    }

    function withdraw() public nonReentrant onlyOwner returns (uint256 amount) {
        amount = address(this).balance;
        require(amount > 0, "No balance to withdraw");
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "ETH transfer failed");
        emit Withdraw(owner(), amount);
        return amount;
    }
}