// src/hooks/useWalletConnection.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import factoryConfig from '../contracts/PropertyTokenFactory.json';

export const useWalletConnection = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [factoryContract, setFactoryContract] = useState(null);

  // 初始化時檢查錢包連接
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // 檢查錢包是否已連接
  const checkWalletConnection = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const contractInstance = new ethers.Contract(
          factoryConfig.address, 
          factoryConfig.abi, 
          signer
        );
        
        setWalletConnected(true);
        setWalletAddress(address);
        setProvider(provider);
        setSigner(signer);
        setFactoryContract(contractInstance);
      }
    }
  };

  // 連接錢包
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("請安裝 MetaMask");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const contractInstance = new ethers.Contract(
        factoryConfig.address, 
        factoryConfig.abi, 
        signer
      );

      setWalletConnected(true);
      setWalletAddress(address);
      setProvider(provider);
      setSigner(signer);
      setFactoryContract(contractInstance);
    } catch (error) {
      alert(`連接錢包失敗: ${error.message}`);
    }
  };

  // 創建合約實例的輔助函數
  const createContract = (address, abi, needsSigner = false) => {
    if (!provider) return null;
    return new ethers.Contract(address, abi, needsSigner ? signer : provider);
  };

  return {
    walletConnected,
    walletAddress,
    provider,
    signer,
    factoryContract,
    connectWallet,
    createContract
  };
};