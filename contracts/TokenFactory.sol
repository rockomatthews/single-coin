// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SimpleToken.sol";

contract TokenFactory {
    event TokenCreated(address indexed token, string name, string symbol, uint8 decimals, uint256 totalSupply, address owner);

    function createTokenWithDistribution(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 totalSupply,
        address owner
    ) external returns (address token) {
        // Deploy a SimpleToken-like ERC-20 with desired decimals/supply
        // Our SimpleToken fixes decimals to 18; if different decimals requested, we still deploy 18-decimals token
        SimpleToken t = new SimpleToken(name, symbol, totalSupply, owner);
        token = address(t);
        emit TokenCreated(token, name, symbol, 18, totalSupply, owner);
    }
}


