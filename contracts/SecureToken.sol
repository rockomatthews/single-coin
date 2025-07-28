// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SecureToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable {
    bool public mintingFinished = false;
    
    event MintingFinished();
    
    modifier canMint() {
        require(!mintingFinished, "Minting is finished");
        _;
    }
    
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply_,
        address owner_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        // Mint initial supply to the owner
        _mint(owner_, initialSupply_);
        
        // Transfer ownership to the specified owner if different from deployer
        if (owner_ != msg.sender) {
            _transferOwnership(owner_);
        }
    }
    
    /**
     * @dev Mints `amount` tokens to `to` address.
     * Can only be called by the owner and when minting is not finished.
     */
    function mint(address to, uint256 amount) public onlyOwner canMint {
        _mint(to, amount);
    }
    
    /**
     * @dev Finishes minting. Can only be called by the owner.
     * This is irreversible.
     */
    function finishMinting() public onlyOwner {
        mintingFinished = true;
        emit MintingFinished();
    }
    
    /**
     * @dev Pauses all token transfers. Can only be called by the owner.
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpauses all token transfers. Can only be called by the owner.
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev See {ERC20-_update}.
     * Requirements:
     * - the contract must not be paused.
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}