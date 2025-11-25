// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title SimpleStorageV2
 * @dev Upgraded version with additional functionality
 * @notice This is V2 - adds a counter and getter for it
 */
contract SimpleStorageV2 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // ⚠️ CRITICAL: Keep existing storage variables in same order!
    uint256 public storedValue;  // Must stay first (slot 0)
    
    // ✅ New storage variable (appended)
    uint256 public updateCount;   // New in V2 (slot 1)

    // Events
    event ValueUpdated(uint256 newValue, address indexed updater);
    event CounterIncremented(uint256 newCount); // New event in V2

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize function (only called on first deployment)
     */
    function initialize(uint256 initialValue) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        storedValue = initialValue;
        updateCount = 0;
    }

    /**
     * @dev Set a new value (upgraded to increment counter)
     * @param newValue The new value to store
     */
    function setValue(uint256 newValue) public {
        storedValue = newValue;
        updateCount++; // New functionality in V2
        emit ValueUpdated(newValue, msg.sender);
        emit CounterIncremented(updateCount);
    }

    /**
     * @dev Get the stored value
     * @return The current stored value
     */
    function getValue() public view returns (uint256) {
        return storedValue;
    }

    /**
     * @dev Get the update count (new function in V2)
     * @return The number of times setValue has been called
     */
    function getUpdateCount() public view returns (uint256) {
        return updateCount;
    }

    /**
     * @dev Authorize upgrades (only owner can upgrade)
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

