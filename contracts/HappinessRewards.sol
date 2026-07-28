// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @notice HAPPINESS is a capped, non-transferable rewards token.
/// @dev No cash redemption, reserve claim, investment return or future migration right is created by this contract.
contract HappinessRewards is ERC20, AccessControl, Pausable {
    bytes32 public constant MEMBER_ISSUER_ROLE = keccak256("MEMBER_ISSUER_ROLE");
    bytes32 public constant COMMUNITY_ISSUER_ROLE = keccak256("COMMUNITY_ISSUER_ROLE");
    bytes32 public constant REDEEMER_ROLE = keccak256("REDEEMER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    address public immutable communityTreasury;
    uint256 public immutable supplyCap;

    mapping(bytes32 issuanceId => bool used) public usedIssuanceIds;
    mapping(bytes32 redemptionId => bool used) public usedRedemptionIds;

    event RewardIssued(
        address indexed member,
        uint256 amount,
        bytes32 indexed issuanceId,
        bytes32 indexed laneId
    );
    event CommunityPoolIssued(
        address indexed treasury,
        uint256 amount,
        bytes32 indexed epochId
    );
    event RewardRedeemed(address indexed member, uint256 amount, bytes32 indexed redemptionId);

    error InvalidAddress();
    error InvalidAmount();
    error InvalidLane();
    error InvalidOperationId();
    error OperationAlreadyUsed();
    error SupplyCapExceeded();
    error MemberTransfersDisabled();

    constructor(address admin, address treasury, uint256 cap) ERC20("HAPPINESS", "IOH") {
        if (admin == address(0) || treasury == address(0)) revert InvalidAddress();
        if (cap == 0) revert InvalidAmount();
        communityTreasury = treasury;
        supplyCap = cap;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MEMBER_ISSUER_ROLE, admin);
        _grantRole(COMMUNITY_ISSUER_ROLE, admin);
        _grantRole(REDEEMER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function issueReward(address member, uint256 amount, bytes32 issuanceId, bytes32 laneId)
        external
        onlyRole(MEMBER_ISSUER_ROLE)
        whenNotPaused
    {
        if (member == address(0)) revert InvalidAddress();
        if (laneId == bytes32(0)) revert InvalidLane();
        _consumeIssuanceId(issuanceId);
        _mintWithinCap(member, amount);
        emit RewardIssued(member, amount, issuanceId, laneId);
    }

    function issueCommunityPool(uint256 amount, bytes32 epochId)
        external
        onlyRole(COMMUNITY_ISSUER_ROLE)
        whenNotPaused
    {
        _consumeIssuanceId(epochId);
        _mintWithinCap(communityTreasury, amount);
        emit CommunityPoolIssued(communityTreasury, amount, epochId);
    }

    function redeemReward(address member, uint256 amount, bytes32 redemptionId)
        external
        onlyRole(REDEEMER_ROLE)
        whenNotPaused
    {
        if (member == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (redemptionId == bytes32(0)) revert InvalidOperationId();
        if (usedRedemptionIds[redemptionId]) revert OperationAlreadyUsed();
        usedRedemptionIds[redemptionId] = true;
        _burn(member, amount);
        emit RewardRedeemed(member, amount, redemptionId);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _consumeIssuanceId(bytes32 operationId) internal {
        if (operationId == bytes32(0)) revert InvalidOperationId();
        if (usedIssuanceIds[operationId]) revert OperationAlreadyUsed();
        usedIssuanceIds[operationId] = true;
    }

    function _mintWithinCap(address recipient, uint256 amount) internal {
        if (amount == 0) revert InvalidAmount();
        if (totalSupply() + amount > supplyCap) revert SupplyCapExceeded();
        _mint(recipient, amount);
    }

    function _update(address from, address to, uint256 amount) internal override whenNotPaused {
        if (from != address(0) && to != address(0)) revert MemberTransfersDisabled();
        super._update(from, to, amount);
    }
}
