// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SecurableToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    address public owner;
    
    // Security features
    bool public mintingEnabled;
    bool public metadataUpdateEnabled;
    bool public ownerControlsEnabled;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event MintingRevoked();
    event MetadataUpdateRevoked();
    event OwnerControlsRevoked();
    
    modifier onlyOwner() {
        require(msg.sender == owner && ownerControlsEnabled, "Not owner or controls revoked");
        _;
    }
    
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        address _owner,
        bool _enableMinting,
        bool _enableMetadataUpdate,
        bool _enableOwnerControls
    ) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * 10**decimals;
        owner = _owner;
        balanceOf[_owner] = totalSupply;
        
        // Set security features
        mintingEnabled = _enableMinting;
        metadataUpdateEnabled = _enableMetadataUpdate;
        ownerControlsEnabled = _enableOwnerControls;
        
        emit Transfer(address(0), _owner, totalSupply);
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
    
    // Minting function (can be permanently disabled)
    function mint(address to, uint256 amount) public onlyOwner {
        require(mintingEnabled, "Minting has been permanently disabled");
        uint256 amountWithDecimals = amount * 10**decimals;
        totalSupply += amountWithDecimals;
        balanceOf[to] += amountWithDecimals;
        emit Transfer(address(0), to, amountWithDecimals);
    }
    
    // Metadata update functions (can be permanently disabled)
    function updateName(string memory newName) public onlyOwner {
        require(metadataUpdateEnabled, "Metadata updates have been permanently disabled");
        name = newName;
    }
    
    function updateSymbol(string memory newSymbol) public onlyOwner {
        require(metadataUpdateEnabled, "Metadata updates have been permanently disabled");
        symbol = newSymbol;
    }
    
    // Security: Permanently revoke minting
    function revokeMinting() public onlyOwner {
        mintingEnabled = false;
        emit MintingRevoked();
    }
    
    // Security: Permanently revoke metadata updates
    function revokeMetadataUpdates() public onlyOwner {
        metadataUpdateEnabled = false;
        emit MetadataUpdateRevoked();
    }
    
    // Security: Permanently revoke all owner controls
    function revokeOwnerControls() public onlyOwner {
        ownerControlsEnabled = false;
        emit OwnerControlsRevoked();
    }
    
    // View functions for security status
    function isMintingRevoked() public view returns (bool) {
        return !mintingEnabled;
    }
    
    function isMetadataUpdateRevoked() public view returns (bool) {
        return !metadataUpdateEnabled;
    }
    
    function isOwnerControlRevoked() public view returns (bool) {
        return !ownerControlsEnabled;
    }
}