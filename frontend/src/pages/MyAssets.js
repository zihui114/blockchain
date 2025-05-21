import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import './MyAssets.css';

// 導入合約配置
import factoryConfig from '../contracts/PropertyTokenFactory.json';
import tokenAbi from '../contracts/MyPropertyToken-abi.json';

const MyAssets = () => {
  // 基本狀態變數
  const [myTokens, setMyTokens] = useState([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [factoryContract, setFactoryContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [ethBalance, setEthBalance] = useState('0');
  const [totalValue, setTotalValue] = useState(0);
  
  // 連接錢包
  const connectWallet = async () => {
    try {
      setIsLoading(true);
      
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        setWalletConnected(true);
        setWalletAddress(address);
        setProvider(provider);
        
        // 初始化工廠合約
        const factoryInstance = new ethers.Contract(
          factoryConfig.address, 
          factoryConfig.abi, 
          signer
        );
        setFactoryContract(factoryInstance);
        
        // 監聽錢包事件
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());
      } else {
        alert("請安裝 MetaMask 或其他 Web3 錢包擴充功能");
      }
    } catch (error) {
      console.error("錢包連接錯誤", error);
      alert(`連接錢包失敗: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 處理帳戶變更
  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      setWalletConnected(false);
      setWalletAddress('');
      setMyTokens([]);
    } else {
      setWalletAddress(accounts[0]);
      refreshData();
    }
  };
  
  // 獲取 ETH 餘額
  const fetchEthBalance = async () => {
    if (!provider || !walletAddress) return;
    
    try {
      const balance = await provider.getBalance(walletAddress);
      setEthBalance(parseFloat(ethers.formatEther(balance)).toFixed(4));
    } catch (error) {
      console.error("獲取 ETH 餘額錯誤", error);
    }
  };
  
  // 獲取代幣資產
  const fetchTokenAssets = async () => {
    if (!factoryContract || !provider || !walletAddress) return;
    
    try {
      setIsLoading(true);
      
      // 獲取所有房產代幣
      const properties = await factoryContract.getAllProperties();
      console.log("從工廠合約獲取的房產:", properties);
      
      // 查詢每個代幣的餘額和細節
      const tokenPromises = properties.map(async (property) => {
        const tokenAddress = property.tokenAddress;
        const propertyName = property.name;
        
        try {
          // 使用標準 ERC20 介面創建合約實例
          const tokenContract = new ethers.Contract(
            tokenAddress,
            tokenAbi,
            provider
          );
          
          // 獲取代幣詳情
          const [name, symbol, balance, decimals] = await Promise.all([
            tokenContract.name(),
            tokenContract.symbol(),
            tokenContract.balanceOf(walletAddress),
            tokenContract.decimals()
          ]);
          
          // 獲取物業信息
          const metadata = getPropertyMetadata(propertyName);
          
          // 格式化餘額
          const formattedBalance = parseFloat(ethers.formatUnits(balance, decimals));
          
          // 估算價值：使用簡單的默認值
          const estimatedValue = formattedBalance * 0.01 * 30000; // 假設 1 份 = 0.01 ETH = 30000 TWD
          
          return {
            id: tokenAddress,
            property: name,
            symbol: symbol,
            amount: formattedBalance,
            value: estimatedValue,
            tokenAddress: tokenAddress,
            location: metadata.location,
            type: metadata.type,
            image: metadata.image,
            decimals: decimals
          };
        } catch (error) {
          console.error(`獲取代幣詳情失敗 ${tokenAddress}:`, error);
          return null;
        }
      });
      
      // 等待所有查詢完成並過濾掉空值
      const tokenResults = (await Promise.all(tokenPromises)).filter(token => token !== null);
      
      // 計算總資產價值
      const total = tokenResults.reduce((sum, token) => sum + token.value, 0);
      setTotalValue(total);
      
      setMyTokens(tokenResults);
    } catch (error) {
      console.error("獲取代幣資產錯誤", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 簡化的物業元數據獲取函數
  const getPropertyMetadata = (propertyName) => {
    // 預設元數據映射
    const metadata = {
      "Taipei Token": { 
        location: "信義區",
        type: "精品住宅",
        image: "/api/placeholder/300/200" 
      },
      "New Taipei Token": {
        location: "板橋區",
        type: "住宅",
        image: "/api/placeholder/300/200"
      },
      "Taichung Token": {
        location: "西區",
        type: "商業",
        image: "/api/placeholder/300/200"
      },
      // 返回默認值
      "default": {
        location: "未知區域",
        type: "未知類型",
        image: "/api/placeholder/300/200"
      }
    };
    
    return metadata[propertyName] || metadata["default"];
  };
  
  // 重新載入所有資料
  const refreshData = () => {
    fetchEthBalance();
    fetchTokenAssets();
  };

  // 初始載入資料
  useEffect(() => {
    if (walletConnected) {
      refreshData();
    }
  }, [walletConnected]);

  return (
    <div className="assets-container">
      <div className="assets-header">
        <h2 className="assets-title">我的房地產資產</h2>
        
        {walletConnected ? (
          <div className="header-buttons">
            <button className="refresh-button" onClick={refreshData} disabled={isLoading}>
              <span className="refresh-icon">↻</span>
              重新整理
            </button>
          </div>
        ) : (
          <button className="connect-wallet-button" onClick={connectWallet} disabled={isLoading}>
            {isLoading ? '連接中...' : '連接錢包'}
          </button>
        )}
      </div>
      
      {!walletConnected ? (
        <div className="connect-wallet-prompt">
          <p>請連接您的錢包以查看您的房地產資產</p>
        </div>
      ) : isLoading ? (
        <div className="loading-container">
          <div className="loader"></div>
          <p>載入資產中...</p>
        </div>
      ) : (
        // 顯示資產
        <>
          <div className="wallet-summary">
            <div className="wallet-info">
              <p className="wallet-address">
                <span className="info-label">錢包地址:</span> 
                <span className="address-text">{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</span>
              </p>
              <p className="eth-balance">
                <span className="info-label">ETH 餘額:</span> {ethBalance} ETH
              </p>
            </div>
            <div className="assets-summary">
              <p className="total-value">總資產價值: NT$ {totalValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              <p className="total-properties">您共持有 {myTokens.length} 個房產的所有權</p>
            </div>
          </div>
          
          {myTokens.length > 0 ? (
            <div className="table-container">
              <table className="assets-table">
                <thead>
                  <tr>
                    <th>物業名稱</th>
                    <th>位置</th>
                    <th>類型</th>
                    <th>持有份數</th>
                    <th>估值 (NT$)</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {myTokens.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td>
                        <div className="property-info">
                          <img src={item.image} alt={item.property} className="property-image" />
                          <div className="property-details">
                            <span className="property-name">{item.property}</span>
                            <span className="property-symbol">{item.symbol}</span>
                          </div>
                        </div>
                      </td>
                      <td>{item.location}</td>
                      <td>{item.type}</td>
                      <td>{item.amount.toFixed(4)} {item.symbol}</td>
                      <td>{item.value.toLocaleString(undefined, {maximumFractionDigits: 0})} TWD</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-button view-button"
                            onClick={() => window.open(`https://sepolia.etherscan.io/token/${item.tokenAddress}`, '_blank')}
                          >
                            查看
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-assets">
              <p>您目前沒有持有任何房產代幣</p>
              <div className="no-assets-buttons">
                <Link to="/" className="create-token-button">
                  創建新代幣
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyAssets;