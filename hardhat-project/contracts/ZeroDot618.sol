// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract ZeroDot618 is ERC721Enumerable, Ownable {
    /**
     * @dev _baseTokenURI 用于计算 {tokenURI}。如果设置，每个token的URI
     * 将是 baseURI 和 tokenId 的连接。
     */
    string _baseTokenURI;

    // _price 是一个 ZeroDot618 NFT 的价格
    uint256 public _price = 0.01 ether;

    // _paused 是用来在紧急情况下暂停合同的
    bool public _paused;

    // 最大的 ZeroDot618 NFT 数量
    uint256 public maxTokenIds = 20;

    // 铸造的ZeroDot618 NFT总数
    uint256 public tokenIds;

    // 白名单合约实例
    IWhitelist whitelist;

    // 用于跟踪预售是否开始
    bool public presaleStarted;

    // 预售结束的时间戳
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused() {
        require(!_paused, "Contract currently paused");
        _;
    }

    /**
     * @dev ERC721构造函数接收了一个名称(name)和一个符号(symbol)到令牌集合。
     * 在我们的例子中，名称是 "ZeroDot618"，符号是 "ZD618"。
     * ZeroDot618的构造函数接收 baseURI，为集合设置 _baseTokenURI
     * 它还初始化了一个白名单接口的实例。
     */
    constructor(string memory baseURI, address whitelistContract)
        ERC721("ZeroDot618", "ZD618")
    {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    /**
     * @dev startPresale 开始为白名单上的地址进行预售
     */
    function startPreSale() public onlyOwner {
        presaleStarted = true;
        // 设置预售结束时间为当前时间戳+5分钟
        // Solidity对时间戳有很酷的语法 seconds, minutes, hours, days, years
        presaleEnded = block.timestamp + 5 minutes;
    }

    /**
     * @dev prealeMint 允许用户在预售期间每笔交易铸造一个NFT
     */
    function presaleMint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp < presaleEnded,
            "Presale is not running"
        );
        require(
            whitelist.whitelistedAddresses(msg.sender),
            "You are not whitelisted"
        );
        require(tokenIds < maxTokenIds, "Exceeded maximum ZeroDot618 supply");
        require(msg.value >= _price, "Ether sent is not cottect");
        tokenIds += 1;
        // _safeMint 是 _mint 函数的一个更安全的版本，因为它确保
        // 如果被铸币的地址是一个合约，那么它知道如何处理ERC721代币
        // 如果被铸币的地址不是合约，它的工作方式与_mint相同
        _safeMint(msg.sender, tokenIds);
    }

    /**
     * @dev mint 允许用户在预售结束后，每笔交易可以铸造1个NFT
     */
    function mint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp >= presaleEnded,
            "Presale has not ended yet"
        );
        require(tokenIds < maxTokenIds, "Exceeded maxinum ZeroDot618 supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    /**
     * @dev _baseURI 覆盖了 Openzeppelin 的 ERC721 实现，该实现默认为为 baseURI 返回一个空字符串
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev setPaused 使合同暂停或不暂停
     */
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    /**
     * @dev withdraw 将合约中所有的以太发给合约的所有者
     */
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    // 接收以太的函数，msg.data 必须是空的
    receive() external payable {}

    // 当 msg.data 不为空时，会调用 fallback 函数
    fallback() external payable {}
}
