// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AccessControlExample
 * @dev Demonstrates OpenZeppelin's AccessControl for role-based permissions
 * Shows how to create roles and assign them to addresses
 */
contract AccessControlExample is AccessControl {
    // Define custom roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    uint256 public totalSupply;
    mapping(address => uint256) public balances;

    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    constructor() {
        // Grant the contract deployer the default admin role
        // This role can grant/revoke other roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Mint tokens - only addresses with MINTER_ROLE can call
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        balances[to] += amount;
        totalSupply += amount;
        emit Mint(to, amount);
    }

    /**
     * @dev Burn tokens - only addresses with BURNER_ROLE can call
     */
    function burn(address from, uint256 amount) public onlyRole(BURNER_ROLE) {
        require(balances[from] >= amount, "Insufficient balance");
        balances[from] -= amount;
        totalSupply -= amount;
        emit Burn(from, amount);
    }

    /**
     * @dev Grant minter role - only ADMIN_ROLE can call
     */
    function grantMinterRole(address account) public onlyRole(ADMIN_ROLE) {
        grantRole(MINTER_ROLE, account);
    }

    /**
     * @dev Revoke minter role - only ADMIN_ROLE can call
     */
    function revokeMinterRole(address account) public onlyRole(ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, account);
    }

    /**
     * @dev Grant burner role - only ADMIN_ROLE can call
     */
    function grantBurnerRole(address account) public onlyRole(ADMIN_ROLE) {
        grantRole(BURNER_ROLE, account);
    }

    /**
     * @dev Revoke burner role - only ADMIN_ROLE can call
     */
    function revokeBurnerRole(address account) public onlyRole(ADMIN_ROLE) {
        revokeRole(BURNER_ROLE, account);
    }

    /**
     * @dev Batch grant multiple roles - only DEFAULT_ADMIN_ROLE can call
     */
    function batchGrantRoles(
        address account,
        bytes32[] memory roles
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i < roles.length; i++) {
            grantRole(roles[i], account);
        }
    }

    /**
     * @dev Check if address has a specific role
     */
    function hasMinterRole(address account) public view returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }

    /**
     * @dev Check if address has burner role
     */
    function hasBurnerRole(address account) public view returns (bool) {
        return hasRole(BURNER_ROLE, account);
    }

    /**
     * @dev Get balance of an address
     */
    function getBalance(address account) public view returns (uint256) {
        return balances[account];
    }
}

