// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UniversalVault
 * @dev Vault contract for ERC20 token deposits and withdrawals
 * @notice ERC777 support removed - OpenZeppelin v5+ no longer includes ERC777
 */
contract UniversalVault is Ownable {
    constructor() Ownable(msg.sender) {}

    event TokensDeposited(address indexed from, address indexed token, uint256 amount);
    event TokensWithdrawn(address indexed to, address indexed token, uint256 amount);

    // ERC20 token deposit
    function depositERC20(address token, uint256 amount) external {
        require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit TokensDeposited(msg.sender, token, amount);
    }

    // Withdraw ERC20 tokens (owner only)
    function withdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).balanceOf(address(this)) >= amount, "Insufficient balance");
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
        emit TokensWithdrawn(owner(), token, amount);
    }

    // Get balance of a specific token
    function getBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

   
}
