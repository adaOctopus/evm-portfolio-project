// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MultiRoleToken
 * @dev Advanced ERC20 token with multiple OpenZeppelin security features:
 * - AccessControl: Role-based permissions (MINTER, BURNER, PAUSER, ADMIN)
 * - Pausable: Can pause all transfers in emergency
 * - ReentrancyGuard: Protection against reentrancy attacks
 * 
 * This is a production-ready example combining multiple OpenZeppelin components
 */
contract MultiRoleToken is ERC20, AccessControl, Pausable, ReentrancyGuard {
    // Define roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Maximum supply cap
    uint256 public maxSupply;

    // Events
    event MaxSupplyUpdated(uint256 oldMaxSupply, uint256 newMaxSupply);
    event Minted(address indexed to, uint256 amount, address indexed minter);
    event Burned(address indexed from, uint256 amount, address indexed burner);

    /**
     * @dev Constructor sets up roles and initial supply
     * @param initialSupply Initial token supply
     * @param _maxSupply Maximum supply cap
     */
    constructor(
        uint256 initialSupply,
        uint256 _maxSupply
    ) ERC20("MultiRoleToken", "MRT") {
        // Grant deployer the default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        // Grant deployer all roles initially
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        maxSupply = _maxSupply;
        
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
    }

    /**
     * @dev Mint tokens - only MINTER_ROLE can call
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) 
        public 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        _mint(to, amount);
        emit Minted(to, amount, msg.sender);
    }

    /**
     * @dev Burn tokens - only BURNER_ROLE can call
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) 
        public 
        onlyRole(BURNER_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        _burn(from, amount);
        emit Burned(from, amount, msg.sender);
    }

    /**
     * @dev Burn tokens from caller's balance
     */
    function burnFromSelf(uint256 amount) public whenNotPaused {
        _burn(msg.sender, amount);
        emit Burned(msg.sender, amount, msg.sender);
    }

    /**
     * @dev Update maximum supply - only DEFAULT_ADMIN_ROLE can call
     * @param newMaxSupply New maximum supply
     */
    function setMaxSupply(uint256 newMaxSupply) 
        public 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(newMaxSupply >= totalSupply(), "New max supply too low");
        uint256 oldMaxSupply = maxSupply;
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(oldMaxSupply, newMaxSupply);
    }

    /**
     * @dev Pause all token transfers - only PAUSER_ROLE can call
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause all token transfers - only PAUSER_ROLE can call
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Override transfer to check if paused
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.transfer(to, amount);
    }

    /**
     * @dev Override transferFrom to check if paused
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev Grant multiple roles at once - only DEFAULT_ADMIN_ROLE can call
     */
    function grantRoles(address account, bytes32[] memory roles) 
        public 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        for (uint256 i = 0; i < roles.length; i++) {
            grantRole(roles[i], account);
        }
    }

    /**
     * @dev Revoke multiple roles at once - only DEFAULT_ADMIN_ROLE can call
     */
    function revokeRoles(address account, bytes32[] memory roles) 
        public 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        for (uint256 i = 0; i < roles.length; i++) {
            revokeRole(roles[i], account);
        }
    }

    /**
     * @dev Get remaining mintable amount
     */
    function getRemainingMintable() public view returns (uint256) {
        return maxSupply - totalSupply();
    }

    /**
     * @dev Check if address can mint
     */
    function canMint(address account) public view returns (bool) {
        return hasRole(MINTER_ROLE, account) && !paused();
    }
}

