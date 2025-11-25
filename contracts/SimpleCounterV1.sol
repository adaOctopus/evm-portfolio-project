// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title SimpleCounterV1
 * @dev Minimal UUPS upgradeable contract - just a counter
 * @notice This is V1 - can only increment
 */
contract SimpleCounterV1 is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    // Storage variable - this persists across upgrades
    uint256 public count;

    event CountIncremented(uint256 newCount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize (replaces constructor for upgradeable contracts)
     * @param initialCount Starting count value
     */
    function initialize(uint256 initialCount) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        count = initialCount;
    }

    /**
     * @dev Increment the counter
     */
    function increment() public {
        count++;
        emit CountIncremented(count);
    }

    /**
     * @dev Get current count
     */
    function getCount() public view returns (uint256) {
        return count;
    }

    /**
     * @dev Authorize upgrades - only owner can upgrade
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

