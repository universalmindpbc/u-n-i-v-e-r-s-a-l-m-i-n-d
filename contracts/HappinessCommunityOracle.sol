// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

interface IReceiver is IERC165 {
    function onReport(bytes calldata metadata, bytes calldata report) external;
}

interface IHappinessCommunityIssuer {
    function issueCommunityPool(uint256 amount, bytes32 epochId) external;
}

/// @notice Receives aggregate community-emission reports from a Chainlink CRE KeystoneForwarder.
/// @dev This contract can issue only to the fixed community treasury inside HappinessRewards.
contract HappinessCommunityOracle is IReceiver, AccessControl, Pausable {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    uint256 public constant MAX_REPORT_VALIDITY_WINDOW = 30 days;

    IHappinessCommunityIssuer public immutable happiness;
    address public immutable forwarder;
    uint256 public immutable maxAmountPerEpoch;

    bytes32 public expectedWorkflowId;
    address public expectedWorkflowAuthor;

    mapping(bytes32 epochId => bool processed) public processedEpochs;

    event WorkflowIdentityConfigured(bytes32 indexed workflowId, address indexed workflowAuthor);
    event CommunityEmissionAccepted(
        bytes32 indexed epochId,
        uint256 amount,
        bytes32 indexed evidenceCommitment,
        uint64 validUntil
    );

    error InvalidAddress();
    error InvalidAmount();
    error InvalidMetadata();
    error InvalidReport();
    error InvalidSender(address sender);
    error WorkflowIdentityNotConfigured();
    error WorkflowIdentityAlreadyConfigured();
    error InvalidWorkflowId(bytes32 received);
    error InvalidWorkflowAuthor(address received);
    error EpochAlreadyProcessed();
    error ReportExpired();
    error ReportValidityTooLong();
    error EpochAmountExceeded();

    constructor(address admin, address happinessAddress, address forwarderAddress, uint256 epochCap) {
        if (admin == address(0) || happinessAddress == address(0) || forwarderAddress == address(0)) {
            revert InvalidAddress();
        }
        if (epochCap == 0) revert InvalidAmount();
        happiness = IHappinessCommunityIssuer(happinessAddress);
        forwarder = forwarderAddress;
        maxAmountPerEpoch = epochCap;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /// @notice Pins the only CRE workflow identity that may request a community emission.
    /// @dev Until both fields are nonzero, all reports fail closed.
    function configureWorkflowIdentity(bytes32 workflowId, address workflowAuthor)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        if (workflowId == bytes32(0) || workflowAuthor == address(0)) revert InvalidAddress();
        if (expectedWorkflowId != bytes32(0) || expectedWorkflowAuthor != address(0)) {
            revert WorkflowIdentityAlreadyConfigured();
        }
        expectedWorkflowId = workflowId;
        expectedWorkflowAuthor = workflowAuthor;
        emit WorkflowIdentityConfigured(workflowId, workflowAuthor);
    }

    function onReport(bytes calldata metadata, bytes calldata report) external override whenNotPaused {
        if (msg.sender != forwarder) revert InvalidSender(msg.sender);
        if (expectedWorkflowId == bytes32(0) || expectedWorkflowAuthor == address(0)) {
            revert WorkflowIdentityNotConfigured();
        }
        if (metadata.length != 64) revert InvalidMetadata();

        (bytes32 workflowId, address workflowAuthor) = _decodeWorkflowIdentity(metadata);
        if (workflowId != expectedWorkflowId) revert InvalidWorkflowId(workflowId);
        if (workflowAuthor != expectedWorkflowAuthor) revert InvalidWorkflowAuthor(workflowAuthor);
        if (report.length != 128) revert InvalidReport();

        (bytes32 epochId, uint256 amount, uint64 validUntil, bytes32 evidenceCommitment) =
            abi.decode(report, (bytes32, uint256, uint64, bytes32));
        if (epochId == bytes32(0) || evidenceCommitment == bytes32(0) || amount == 0) revert InvalidReport();
        if (processedEpochs[epochId]) revert EpochAlreadyProcessed();
        if (block.timestamp > validUntil) revert ReportExpired();
        if (uint256(validUntil) > block.timestamp + MAX_REPORT_VALIDITY_WINDOW) revert ReportValidityTooLong();
        if (amount > maxAmountPerEpoch) revert EpochAmountExceeded();

        processedEpochs[epochId] = true;
        happiness.issueCommunityPool(amount, epochId);
        emit CommunityEmissionAccepted(epochId, amount, evidenceCommitment, validUntil);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(IERC165, AccessControl)
        returns (bool)
    {
        return interfaceId == type(IReceiver).interfaceId || super.supportsInterface(interfaceId);
    }

    function _decodeWorkflowIdentity(bytes calldata metadata)
        private
        pure
        returns (bytes32 workflowId, address workflowAuthor)
    {
        workflowId = bytes32(metadata[0:32]);
        workflowAuthor = address(bytes20(metadata[42:62]));
    }
}
