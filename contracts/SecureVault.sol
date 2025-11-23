// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SecureVault
 * @dev Demonstrates OpenZeppelin security features:
 * - Ownable: Access control with ownership
 * - ReentrancyGuard: Protection against reentrancy attacks
 * - Pausable: Emergency pause functionality
 */
contract SecureVault is Ownable, ReentrancyGuard, Pausable {
    mapping(address => uint256) public deposits;
    uint256 public totalDeposits;

    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed owner, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Deposit funds into the vault
     * @notice Uses nonReentrant modifier to prevent reentrancy attacks
     */
    function deposit() public payable whenNotPaused nonReentrant {
        require(msg.value > 0, "Must deposit something");
        
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw funds from the vault
     * @param amount Amount to withdraw
     * @notice Uses nonReentrant to prevent reentrancy, whenNotPaused to ensure not paused
     */
    function withdraw(uint256 amount) public whenNotPaused nonReentrant {
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        require(address(this).balance >= amount, "Contract insufficient funds");

        deposits[msg.sender] -= amount;
        totalDeposits -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawal(msg.sender, amount);
    }

    /**
     * @dev Emergency withdrawal - only owner can call
     * @notice Allows owner to withdraw all funds in emergency (e.g., if vulnerability found)
     */
    function emergencyWithdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        totalDeposits = 0;

        (bool success, ) = owner().call{value: balance}("");
        require(success, "Emergency withdraw failed");

        emit EmergencyWithdraw(owner(), balance);
    }

    /**
     * @dev Pause the contract - only owner
     * @notice Stops all deposits and withdrawals
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract - only owner
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Get user's deposit balance
     */
    function getBalance(address user) public view returns (uint256) {
        return deposits[user];
    }

    /**
     * @dev Get contract's total balance
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}

