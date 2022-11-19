const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });
const { WHITELIST_CONTRACT_ADDRESS, METADATA_URL } = require("../constants");

const main = async () => {
  // 获取之前部署过的白名单合约地址
  const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
  // 可以提取 ZeroDot618 NFT 元数据的 URL
  const metadataURL = METADATA_URL;

  /**
   * 在ethers.js中，ContractFactory是一个用于部署新智能合约的抽象。
   * 所以这里的 zeroDot618Contract 是我们的 ZeroDot618 合约实例的工厂。
   */
  const zeroDot618Contract = await ethers.getContractFactory("ZeroDot618");

  // 部署合约
  const deployedZeroDot618Contract = await zeroDot618Contract.deploy(
    metadataURL,
    whitelistContract
  );

  // 打印合约地址
  console.log("ZeroDot Contract Address: ", deployedZeroDot618Contract.address);

}

// 调用主函数，如果有任何错误则捕捉
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
