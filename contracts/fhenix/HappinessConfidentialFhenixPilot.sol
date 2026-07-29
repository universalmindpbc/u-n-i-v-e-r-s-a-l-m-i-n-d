// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {FHE, euint64, InEuint64} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

/// @notice Separate, non-transferable CoFHE experiment for confidential HAPPINESS balances.
/// @dev This pilot accepts reward-domain attestations only. It is not the production IOH contract.
contract HappinessConfidentialFhenixPilot {
    error AttestationAlreadyProcessed();
    error InvalidRecipient();
    error NotIssuer();

    address public immutable issuer;
    mapping(bytes32 attestationCommitment => bool processed) public processedAttestations;
    mapping(address account => euint64 encryptedBalance) private encryptedBalances;

    event ConfidentialRewardCredited(bytes32 indexed attestationCommitment);

    constructor(address issuer_) {
        if (issuer_ == address(0)) revert NotIssuer();
        issuer = issuer_;
    }

    function credit(
        bytes32 attestationCommitment,
        address recipient,
        InEuint64 calldata encryptedAmount
    ) external {
        if (msg.sender != issuer) revert NotIssuer();
        if (recipient == address(0)) revert InvalidRecipient();
        if (processedAttestations[attestationCommitment]) revert AttestationAlreadyProcessed();

        processedAttestations[attestationCommitment] = true;
        euint64 amount = FHE.asEuint64(encryptedAmount);
        euint64 nextBalance = FHE.add(encryptedBalances[recipient], amount);
        encryptedBalances[recipient] = nextBalance;
        FHE.allowThis(nextBalance);
        FHE.allow(nextBalance, recipient);

        emit ConfidentialRewardCredited(attestationCommitment);
    }

    function encryptedBalance() external view returns (euint64) {
        return encryptedBalances[msg.sender];
    }
}
