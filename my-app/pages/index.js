import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // walletConnected 追踪用户的钱包是否已连接
  const [walletConnected, setWalletConnected] = useState(false);
  // presaleStarted 跟踪预售是否已经开始
  const [presaleStarted, setPresaleStarted] = useState(false);
  // presaleEnded 跟踪预售是否结束。
  const [presaleEnded, setPresaleEnded] = useState(false);
  // loading 跟踪加载状态
  const [loading, setLoading] = useState(false);
  // isOwner 检查当前连接的MetaMask钱包是否是合约的所有者
  const [isOwner, setIsOwner] = useState(false);
  // tokenIdsMinted 跟踪已经被铸造的tokenIds的数量
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  // 创建一个对Web3 Modal 的引用（用于连接到Metamask），只要页面打开就会持续存在。
  const web3ModalRef = useRef();

  /**
   * 返回一个代表Ethereum RPC的提供者或签署者对象，无论是否有签署能力的metamask附件
   *
   * provider 用于与区块链互动--读取交易、读取余额、读取状态等。
   * signer 是一种特殊类型的 provider，用于需要向区块链进行 "写 "交易的情况，这涉及到连接的账户
   * 需要进行数字签名以授权正在发送的交易
   * Metamask暴露了一个签名者API，允许你的网站使用 Signer 函数向用户请求签名。
   * 
   * @param {*} needSigner - 如果你需要 signer，则为真，否则默认为假。
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // 连接 Metemask
    // 由于我们将 web3Modal 存储为一个引用，我们需要访问 current 值，以获得对底层对象的访问。
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // 如果用户连接的不是 Goerli 网络，则要抛出错误告知用户
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("change the network to Goerli");
      throw new Error("Change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer
    }
    return web3Provider;
  }


  /**
   * presaleMint: 预售期铸造 NFT
   */
  const presaleMint = async () => {
    try {
      // 写操作，需要签名者
      const signer = await getProviderOrSigner(true);
      // 用签名者创建合约实例以允许更新方法
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // 调用合约的预售期铸币函数 presaleMint，只有白名单的用户才允许铸造
      const tx = await nftContract.presaleMint({
        // 值表示一个ZeroDot618 NFT 的成本是 "0.01"
        // 我们正在使用ethers.js的utils库将 0.01 字符串解析为以太
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // 等待交易完成
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a ZeroDot618!");
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * publicMint: 预售之后的公开铸造 NFT
   */
  const publicMint = async () => {
    try {
      // 写操作，需要签名者
      const signer = await getProviderOrSigner(true);
      // 用签名者创建合约实例以允许更新方法
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // 调用合约的铸币函数 mint
      const tx = await nftContract.mint({
        // 值表示一个ZeroDot618 NFT 的成本是 "0.01"
        // 我们正在使用ethers.js的utils库将 0.01 字符串解析为以太
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // 等待交易完成
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a ZeroDot618!");
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * connectWallet: 连接 metamask 钱包
   */
  const connectWallet = async () => {
    try {
      // 从 web3Modal 中获得提供者，在我们的例子中是MetaMask
      // 第一次使用时，它提示用户连接他们的钱包
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * startPresale: 开始NFT系列的预售
   */
  const startPresale = async () => {
    try {
      // 写操作，需要签名者
      const signer = await getProviderOrSigner(true);
      // 用签名者创建合约实例以允许更新方法
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // 调用合约的开启预售函数 startPresale
      const tx = await nftContract.startPresale();
      setLoading(true);
      // 等待交易完成
      await tx.wait();
      setLoading(false);
      // 设置预售状态为 true
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * checkIfPresaleStarted 检查合约中的预售状态变量 presaleStarted
   */
  const checkIfPresaleStarted = async () => {
    try {
      // 写操作，需要签名者
      const provider = await getProviderOrSigner();
      // 用签名者创建合约实例以允许更新方法
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // 调用合约的预售状态变量
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  /**
   * checkIfPresaleEnded 检查合约中的预售结束状态变量 presaleEnded
   */
  const checkIfPresaleEnded = async () => {
    try {
      // 写操作，需要签名者
      const provider = await getProviderOrSigner();
      // 用签名者创建合约实例以允许更新方法
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // 调用合约的预售结束状态变量
      const _presaleEnded = await nftContract.presaleEnded();
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  /**
   * getOwner: 获取合约拥有着
   */
  const getOwner = async () => {
    try {
      // 提供者
      const provider = await getProviderOrSigner();
      // 用签名者创建合约实例以允许更新方法
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // 调用合约的获取拥有者函数
      const _owner = await nftContract.owner();
      // 我们现在要让签名者提取当前连接的MetaMask账户的地址
      const signer = await getProviderOrSigner(true);
      // 获取与MetaMask相连的签名者的相关地址
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  /**
   * getTokenIdsMinted: 获取已经铸造的tokenIds的数量
   */
  const getTokenIdsMinted = async () => {
    try {
      // 提供者
      const provider = await getProviderOrSigner();
      // 用签名者创建合约实例以允许更新方法
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // 调用合约的 tokenIds
      const _tokenIds = await nftContract.tokenIds();
      // _tokenIds 是一个 "大数"。我们需要将大数转换为一个字符串
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  }

  // useEffects 用于对网站状态的变化做出反应
  // 函数调用结束时的数组表示哪些状态变化将触发这一效果
  // 本项目中，只要 walletConnected 的值发生变化，这个效果将被调用
  useEffect(() => {
    // 如果钱包没有连接，创建一个新的Web3Modal实例并连接MetaMask钱包
    if (!walletConnected) {
      // 通过设置参考对象的`current`值，将Web3Modal类分配给参考对象
      // 只要这个页面打开，`current`值就一直存在。
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      // 检查预售是否开始和结束
      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded();
      }

      getTokenIdsMinted();

      // 设置一个间隔，每5秒调用一次，以检查预售是否结束
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded()
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // 设置一个时间间隔，以获得每5秒钟铸造的代币Ids的数量
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  /**
   * renderButton: 根据dapp的状态返回一个按钮
   */
  const renderButton = () => {
    // 如果钱包没有连接，返回一个按钮，允许他们连接他们的钱包
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          连接钱包
        </button>
      );
    }

    // 如果我们目前正在等待什么，返回一个加载按钮
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    // 如果连接的用户是所有者，并且预售还没有开始，允许他们开始预售
    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          开启预售
        </button>
      )
    }

    // 如果连接的用户不是所有者，但预售还没有开始，告诉他们
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>预售还未开始！</div>
        </div>
      )
    }

    // 如果预售开始了，但还没有结束，允许在预售期间造币
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            预售开始了，如果你是白名单用户，可以铸造一个 ZeroDot618 NFT 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            开始铸造 🚀
          </button>
        </div>
      )
    }

    // 如果预售开始并已结束，则是公开铸币的时候了。
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          开始铸造 🚀
        </button>
      );
    }
  }

  return (
    <div>
      <Head>
        <title>ZeroDot618 Devs</title>
        <meta name="description" content="nft-colloection-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>欢迎来到 ZeroDot618 Devs!</h1>
          <div className={styles.description}>
            这是一个加密开发者的NFT专辑
          </div>
          <div className={styles.description}>
            ZeroDot618 NFT 铸造个数：{tokenIdsMinted}/20
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./zerodot618/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by ZeroDot618 Devs
      </footer>
    </div>
  )
}
