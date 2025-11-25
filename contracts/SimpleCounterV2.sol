// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title SimpleCounterV2
 * @dev Upgraded version - adds decrement functionality
 * @notice This is V2 - can increment AND decrement
 * 
 * ⚠️ CRITICAL: Storage layout must match V1 exactly!
 * - Keep existing variables in same order
 * - Only append new variables
 */
contract SimpleCounterV2 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // ⚠️ MUST keep existing storage in same order as V1
    uint256 public count;  // Slot 0 - same as V1

    // ✅ New storage variable (appended - safe!)
    uint256 public maxCount;  // Slot 1 - new in V2

    event CountIncremented(uint256 newCount);
    event CountDecremented(uint256 newCount);  // New event in V2

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize (only called on first deployment, not on upgrade)
     */
    function initialize(uint256 initialCount) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        count = initialCount;
        maxCount = initialCount;  // Initialize new variable
    }

    /**
     * @dev Increment the counter (same as V1, but also tracks max)
     */
    function increment() public {
        count++;
        if (count > maxCount) {
            maxCount = count;
        }
        emit CountIncremented(count);
    }

    /**
     * @dev Decrement the counter (NEW in V2!)
     */
    function decrement() public {
        require(count > 0, "Count cannot go below 0");
        count--;
        emit CountDecremented(count);
    }

    /**
     * @dev Get current count (same as V1)
     */
    function getCount() public view returns (uint256) {
        return count;
    }

    /**
     * @dev Get max count (NEW in V2!)
     */
    function getMaxCount() public view returns (uint256) {
        return maxCount;
    }

    /**
     * @dev Authorize upgrades - only owner can upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

