// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title TimeLockExample
 * @dev Demonstrates time-delayed operations for security
 * Shows how to implement delays for sensitive operations
 */
contract TimeLockExample is Ownable {
    // Mapping to track proposal timestamps
    mapping(bytes32 => uint256) public proposalTimestamps;
    
    // Minimum delay before execution (e.g., 1 day = 86400 seconds)
    uint256 public constant MIN_DELAY = 86400; // 24 hours
    
    event ProposalCreated(bytes32 indexed proposalId, address indexed proposer, uint256 executeTime);
    event ProposalExecuted(bytes32 indexed proposalId);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a proposal to change an important parameter
     * @param newValue The new value to set
     * @param data The function call data
     * @return proposalId The unique identifier for this proposal
     */
    function proposeChange(
        uint256 newValue,
        bytes memory data
    ) public onlyOwner returns (bytes32) {
        bytes32 proposalId = keccak256(abi.encodePacked(newValue, data, block.timestamp));
        uint256 executeTime = block.timestamp + MIN_DELAY;
        
        proposalTimestamps[proposalId] = executeTime;
        
        emit ProposalCreated(proposalId, msg.sender, executeTime);
        return proposalId;
    }

    /**
     * @dev Execute a proposal after the delay period
     * @param proposalId The proposal to execute
     */
    function executeProposal(
        bytes32 proposalId,
        uint256 /* newValue */,
        bytes memory /* data */
    ) public onlyOwner {
        require(proposalTimestamps[proposalId] > 0, "Proposal does not exist");
        require(block.timestamp >= proposalTimestamps[proposalId], "Proposal not ready");
        
        // Here you would typically execute the actual change
        // For example, updating a critical parameter
        
        delete proposalTimestamps[proposalId];
        
        emit ProposalExecuted(proposalId);
    }

    /**
     * @dev Cancel a proposal - only owner
     */
    function cancelProposal(bytes32 proposalId) public onlyOwner {
        require(proposalTimestamps[proposalId] > 0, "Proposal does not exist");
        delete proposalTimestamps[proposalId];
    }

    /**
     * @dev Check if a proposal can be executed
     */
    function canExecute(bytes32 proposalId) public view returns (bool) {
        if (proposalTimestamps[proposalId] == 0) return false;
        return block.timestamp >= proposalTimestamps[proposalId];
    }

    /**
     * @dev Get the execution time for a proposal
     */
    function getExecutionTime(bytes32 proposalId) public view returns (uint256) {
        return proposalTimestamps[proposalId];
    }
}

