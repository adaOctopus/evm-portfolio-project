// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title SimpleStorageV1
 * @dev Minimal UUPS upgradeable contract - stores a number
 * @notice This is the initial version (V1)
 */
contract SimpleStorageV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // Storage variable - can be modified in upgrades (append only!)
    uint256 public storedValue;
    
    // Events
    event ValueUpdated(uint256 newValue, address indexed updater);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize function (replaces constructor for upgradeable contracts)
     * @param initialValue Initial value to store
     */
    function initialize(uint256 initialValue) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        storedValue = initialValue;
    }

    /**
     * @dev Set a new value
     * @param newValue The new value to store
     */
    function setValue(uint256 newValue) public {
        storedValue = newValue;
        emit ValueUpdated(newValue, msg.sender);
    }

    /**
     * @dev Get the stored value
     * @return The current stored value
     */
    function getValue() public view returns (uint256) {
        return storedValue;
    }

    /**
     * @dev Authorize upgrades (only owner can upgrade)
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

