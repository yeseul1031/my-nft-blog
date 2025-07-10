import React, { useState } from "react";
import Web3 from "web3";

function MetaMaskConnect() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [status, setStatus] = useState("");

  // 1. 지갑 연동하기
  async function connectWallet() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
        setStatus("Wallet connected");

        // 2. 잔액 확인
        const web3 = new Web3(window.ethereum);
        const balanceWei = await web3.eth.getBalance(accounts[0]);
        const balanceEth = web3.utils.fromWei(balanceWei, "ether");
        setBalance(balanceEth);
      } catch (error) {
        setStatus("Connection failed: " + error.message);
      }
    } else {
      setStatus("MetaMask is not installed");
    }
  }

  // 3. 트랜잭션 실행
  async function sendTransaction() {
    if (!account) {
      setStatus("Please connect wallet first");
      return;
    }
    try {
      setStatus("Sending transaction...");
      const txParams = {
        from: account,
        to: account, // 예시: 자기 자신에게 0 ETH 전송 (테스트용)
        value: "0x0"
      };
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });
      setStatus("Transaction sent: " + txHash);
    } catch (error) {
      if (error.code === 4001) {
        setStatus("Transaction rejected by user");
      } else {
        setStatus("Transaction failed: " + error.message);
      }
    }
  }

  return (
    <div>
      <button onClick={connectWallet}>지갑 연동하기</button>
      <div>연결된 지갑 주소: {account || "연결 안됨"}</div>
      <div>잔액: {balance ? balance + " ETH" : "-"}</div>
      <button onClick={sendTransaction}>트랜잭션 실행</button>
      <div>상태: {status}</div>
    </div>
  );
}

export default MetaMaskConnect;
