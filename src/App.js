// src/App.js
import React, { useEffect, useState, useCallback } from "react";
import Web3 from "web3";
import MyNFT from "./MyNFT.json";
import contractAddresses from "./contract-address.json";
import "./App.css";

const contractAddress = contractAddresses.MyNFT;
const kairosChainId = "0x3e9";
const kairosParams = {
  chainId: kairosChainId,
  chainName: "Kairos Testnet",
  rpcUrls: ["https://api.testnet.kairoschain.io"],
  nativeCurrency: { name: "KAIROS", symbol: "KAIROS", decimals: 18 },
  blockExplorerUrls: ["https://explorer.testnet.kairoschain.io"]
};

// 메타마스크 아이콘 Base64 (SVG)
// 출처: https://github.com/MetaMask/brand-resources
const METAMASK_ICON =
  "data:image/svg+xml;utf8,<svg width='32' height='32' viewBox='0 0 212 189' fill='none' xmlns='http://www.w3.org/2000/svg'><g><polygon fill='%23E17726' points='185.511,1 115.366,52.989 128.73,25.299'/><polygon fill='%23E27625' points='26.489,1 83.17,25.557 96.091,53.293'/><polygon fill='%23E27625' points='173.873,137.471 151.98,172.5 182.609,181.001 190.997,138.181'/><polygon fill='%23E27625' points='20.984,138.181 29.371,181.001 60.001,172.5 38.107,137.471'/><polygon fill='%23E27625' points='59.568,81.274 50.819,94.938 93.01,96.815 91.664,51.073'/><polygon fill='%23E27625' points='152.429,81.274 120.157,51.073 118.91,96.815 161.102,94.938'/><polygon fill='%23D5BFB2' points='60.001,172.5 92.032,158.019 64.697,136.013'/><polygon fill='%23D5BFB2' points='119.968,158.019 151.98,172.5 147.303,136.013'/><polygon fill='%23233447' points='151.98,172.5 119.968,158.019 122.556,179.343 122.276,180.223 151.98,172.5'/><polygon fill='%23233447' points='60.001,172.5 89.724,180.223 89.444,179.343 92.032,158.019 60.001,172.5'/><polygon fill='%23CC6228' points='89.999,131.5 64.11,123.969 82.72,115.266'/><polygon fill='%23CC6228' points='122.001,131.5 129.28,115.266 147.89,123.969'/><polygon fill='%23E27525' points='60.001,172.5 64.854,137.09 38.107,137.471'/><polygon fill='%23E27525' points='147.146,137.09 151.98,172.5 173.873,137.471'/><polygon fill='%23F5841F' points='173.873,137.471 147.303,136.013 147.146,137.09 151.98,172.5 173.873,137.471'/><polygon fill='%23F5841F' points='38.107,137.471 64.697,136.013 64.854,137.09 60.001,172.5 38.107,137.471'/><polygon fill='%23C0AC9D' points='122.276,180.223 119.968,158.019 122.001,159.699 122.556,179.343 122.276,180.223'/><polygon fill='%23C0AC9D' points='89.444,179.343 89.999,159.699 92.032,158.019 89.724,180.223 89.444,179.343'/><polygon fill='%23233447' points='122.001,159.699 119.968,158.019 122.001,131.5 122.001,159.699'/><polygon fill='%23233447' points='89.999,159.699 89.999,131.5 92.032,158.019 89.999,159.699'/><polygon fill='%23E17726' points='122.001,131.5 129.28,115.266 122.001,119.963 122.001,131.5'/><polygon fill='%23E17726' points='89.999,131.5 89.999,119.963 82.72,115.266 89.999,131.5'/><polygon fill='%23F5841F' points='82.72,115.266 89.999,119.963 89.999,111.508 82.72,115.266'/><polygon fill='%23F5841F' points='129.28,115.266 122.001,111.508 122.001,119.963 129.28,115.266'/><polygon fill='%23C0AC9D' points='122.001,111.508 129.28,115.266 147.89,123.969 122.001,111.508'/><polygon fill='%23C0AC9D' points='82.72,115.266 89.999,111.508 64.11,123.969 82.72,115.266'/><polygon fill='%23E17726' points='147.89,123.969 129.28,115.266 122.001,131.5 147.89,123.969'/><polygon fill='%23E17726' points='64.11,123.969 89.999,131.5 82.72,115.266 64.11,123.969'/></g></svg>";

function getProvider(type) {
  if (window.ethereum?.providers?.length) {
    for (const p of window.ethereum.providers) {
      if (type === "metamask" && p.isMetaMask) return p;
      if (type === "trust" && (p.isTrust || p.isTrustWallet)) return p;
    }
  }
  if (type === "metamask" && window.ethereum?.isMetaMask) return window.ethereum;
  if (type === "trust" && (window.ethereum?.isTrust || window.ethereum?.isTrustWallet)) return window.ethereum;
  return null;
}

function App() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [walletStatus, setWalletStatus] = useState("");
  const [providerType, setProviderType] = useState("");
  const [contract, setContract] = useState(null);
  const [ownedTokens, setOwnedTokens] = useState([]);
  const [tokenMetas, setTokenMetas] = useState({});
  const [mintURI, setMintURI] = useState("");
  const [transferTokenId, setTransferTokenId] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [mintStatus, setMintStatus] = useState("");
  const [transferStatus, setTransferStatus] = useState("");
  const [eventStatus, setEventStatus] = useState("");
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  useEffect(() => {
    async function switchToKairos() {
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: kairosChainId }]
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [kairosParams]
            });
          }
        }
      }
    }
    switchToKairos();
  }, []);

  async function connectWallet(type) {
    const provider = getProvider(type);
    if (!provider) {
      setWalletStatus(type === "metamask" ? "메타마스크를 설치하세요." : "Trust Wallet을 설치하세요.");
      return;
    }
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      setProviderType(type);
      setWalletStatus(type === "metamask" ? "메타마스크 연결됨" : "Trust Wallet 연결됨");
      const web3 = new Web3(provider);
      const balanceWei = await web3.eth.getBalance(accounts[0]);
      const balanceEth = web3.utils.fromWei(balanceWei, "ether");
      setBalance(balanceEth);
      const contractInstance = new web3.eth.Contract(MyNFT.abi, contractAddress);
      setContract(contractInstance);
    } catch (error) {
      setWalletStatus("연결 실패: " + error.message);
    }
  }

  async function sendTransaction() {
    if (!account || !providerType) {
      setWalletStatus("먼저 지갑을 연결하세요");
      return;
    }
    const provider = getProvider(providerType);
    try {
      setWalletStatus("트랜잭션 전송 중...");
      const txParams = {
        from: account,
        to: account,
        value: "0x0"
      };
      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });
      setWalletStatus("트랜잭션 전송됨: " + txHash);
    } catch (error) {
      if (error.code === 4001) {
        setWalletStatus("사용자가 트랜잭션을 거부함");
      } else {
        setWalletStatus("트랜잭션 실패: " + error.message);
      }
    }
  }

  const fetchMyNFTs = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const balance = await contract.methods.balanceOf(account).call();
      let tokens = [];
      let metas = {};
      for (let i = 0; i < balance; i++) {
        const tokenId = await contract.methods.tokenOfOwnerByIndex(account, i).call();
        tokens.push(tokenId);
        const uri = await contract.methods.tokenURI(tokenId).call();
        const res = await fetch(uri);
        metas[tokenId] = await res.json();
      }
      setOwnedTokens(tokens);
      setTokenMetas(metas);
    } catch (e) {
      setOwnedTokens([]);
      setTokenMetas({});
    }
  }, [contract, account]);

  useEffect(() => {
    if (!contract || !account) return;
    setEventStatus("이벤트 리스닝 활성화됨");
    fetchMyNFTs();

    let transferSub, approvalSub;
    try {
      transferSub = contract.events.Transfer({
        filter: {},
        fromBlock: "latest"
      })
        .on("data", (event) => {
          setEventStatus(`Transfer 이벤트 발생: Token ID ${event.returnValues.tokenId}`);
          fetchMyNFTs();
          setTimeout(() => setEventStatus("이벤트 리스닝 활성화됨"), 2000);
        })
        .on("error", (e) => {
          setEventStatus("Transfer 이벤트 리스닝 오류: " + (e?.message || e));
          console.error("Transfer 이벤트 리스닝 중 오류:", e);
        });

      approvalSub = contract.events.Approval({
        filter: {},
        fromBlock: "latest"
      })
        .on("data", (event) => {
          setEventStatus(`Approval 이벤트 발생: Token ID ${event.returnValues.tokenId}`);
          fetchMyNFTs();
          setTimeout(() => setEventStatus("이벤트 리스닝 활성화됨"), 2000);
        })
        .on("error", (e) => {
          setEventStatus("Approval 이벤트 리스닝 오류: " + (e?.message || e));
          console.error("Approval 이벤트 리스닝 중 오류:", e);
        });
    } catch (e) {
      setEventStatus("이벤트 리스닝 등록 중 오류 발생: " + (e?.message || e));
      console.error("이벤트 리스닝 등록 중 오류:", e);
    }

    return () => {
      setEventStatus("이벤트 리스닝 해제됨");
      try {
        if (transferSub && typeof transferSub.unsubscribe === "function") transferSub.unsubscribe();
        if (approvalSub && typeof approvalSub.unsubscribe === "function") approvalSub.unsubscribe();
      } catch (e) {}
    };
  }, [contract, account, fetchMyNFTs]);

  async function mintNFT() {
    if (!contract || !mintURI) return;
    try {
      setMintStatus("민팅중입니다...");
      await contract.methods.mint(account, mintURI).send({ from: account });
      setMintURI("");
      setMintStatus("민팅완료!");
      setTimeout(() => setMintStatus(""), 2000);
    } catch (e) {
      setMintStatus("민팅 실패: " + (e?.message || e));
      setTimeout(() => setMintStatus(""), 3000);
    }
  }

  async function transferNFT() {
    if (!contract || !transferTokenId || !transferTo) return;
    try {
      setTransferStatus("전송중...");
      await contract.methods.transferFrom(account, transferTo, transferTokenId).send({ from: account });
      setTransferTokenId("");
      setTransferTo("");
      setTransferStatus("전송완료!");
      setTimeout(() => setTransferStatus(""), 2000);
    } catch (e) {
      setTransferStatus("전송 실패: " + (e?.message || e));
      setTimeout(() => setTransferStatus(""), 3000);
    }
  }

  return (
    <div className="container">
      <h2>My NFT DApp</h2>
      <div className="section">
        <button className="button" onClick={() => setWalletModalOpen(true)}>
          {account ? "지갑 연결됨" : "지갑 연결하기"}
        </button>
        <div className="status">{walletStatus}</div>
        <div style={{fontSize:"1.1rem", marginTop:8}}>지갑 주소: {account || "-"}</div>
        <div style={{fontSize:"1.1rem"}}>잔액: {balance ? balance + " ETH" : "-"}</div>
        <button className="button" onClick={sendTransaction}>트랜잭션 실행</button>
      </div>
      <div className="section">
        <span className="label">NFT 민팅 (오너만)</span>
        <input
          type="text"
          placeholder="메타데이터 URI"
          value={mintURI}
          onChange={e => setMintURI(e.target.value)}
        />
        <button className="button" onClick={mintNFT}>민팅</button>
        <div className="status">{mintStatus}</div>
      </div>
      <div className="section">
        <span className="label">NFT 전송</span>
        <input
          type="text"
          placeholder="Token ID"
          value={transferTokenId}
          onChange={e => setTransferTokenId(e.target.value)}
        />
        <input
          type="text"
          placeholder="받는 지갑 주소"
          value={transferTo}
          onChange={e => setTransferTo(e.target.value)}
        />
        <button className="button" onClick={transferNFT}>전송</button>
        <div className="status" style={{color:"#28a745"}}>{transferStatus}</div>
      </div>
      <div className="status" style={{color:"#6c757d", margin:"16px 0"}}>
        {eventStatus}
      </div>
      <div className="section">
        <span className="label">내 NFT 목록</span>
        {ownedTokens.length === 0 && <div>보유한 NFT가 없습니다.</div>}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          {ownedTokens.map(tokenId => (
            <div key={tokenId} style={{ border: "1px solid #ccc", padding: 10, width: 180, borderRadius: 10 }}>
              <div>Token ID: {tokenId}</div>
              {tokenMetas[tokenId] && (
                <>
                  <img src={tokenMetas[tokenId].image} alt="" style={{ width: "100%", margin: "10px 0", borderRadius: 8 }} />
                  <div><b>{tokenMetas[tokenId].name}</b></div>
                  <div style={{ fontSize: 12 }}>{tokenMetas[tokenId].description}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      {walletModalOpen && (
        <div className="wallet-modal-bg" onClick={() => setWalletModalOpen(false)}>
          <div className="wallet-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{marginBottom:24}}>지갑 선택</h3>
            <div
              className="wallet-option"
              onClick={() => { connectWallet("metamask"); setWalletModalOpen(false); }}>
              <img src={METAMASK_ICON} className="wallet-icon" alt="MetaMask" />
              MetaMask
            </div>
            <div
              className="wallet-option"
              onClick={() => { connectWallet("trust"); setWalletModalOpen(false); }}>
              <img src="https://trustwallet.com/assets/images/media/assets/TWT.svg" className="wallet-icon" alt="Trust Wallet" />
              Trust Wallet
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
