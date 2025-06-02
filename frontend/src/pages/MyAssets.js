import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { formatUnits } from "ethers";
import { Link } from 'react-router-dom';
import './MyAssets.css';

// 導入合約配置
import factoryConfig from '../contracts/PropertyTokenFactory.json';
import tokenAbi from '../contracts/MyPropertyToken-abi.json';
import marketplaceAbi from '../contracts/PropertyMarketplace.json';

const MARKETPLACE_ADDRESS = marketplaceAbi.address;

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
  
  const [listingToken, setListingToken] = useState(null);
  const [listingAmount, setListingAmount] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [isListing, setIsListing] = useState(false);

  // 創建賣單函數
  const createListing = async () => {
    if (!listingToken || !listingAmount || !listingPrice) {
      alert("請完整輸入資料");
      return;
    }

    try {
      setIsListing(true);

      const signer = await provider.getSigner();
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, marketplaceAbi.abi, signer);
      const tokenContract = new ethers.Contract(listingToken.tokenAddress, tokenAbi, signer);

      const decimals = await tokenContract.decimals();
      const amountInUnits = ethers.parseUnits(listingAmount.toString(), decimals);
      const priceInWei = ethers.parseEther(listingPrice.toString(), 18);

      // 檢查並處理授權
      const allowance = await tokenContract.allowance(walletAddress, MARKETPLACE_ADDRESS);
      if (allowance < amountInUnits) {
        const approveTx = await tokenContract.approve(MARKETPLACE_ADDRESS, amountInUnits);
        await approveTx.wait();
      }

      // 創建賣單
      const tx = await marketplaceContract.createListing(
        listingToken.tokenAddress,
        amountInUnits,
        priceInWei
      );

      console.log('amountInUnits', amountInUnits);
      console.log('priceInWei', priceInWei);

      await tx.wait();
      alert("賣單建立成功！");
      
      // 重置表單
      setListingToken(null);
      setListingAmount('');
      setListingPrice('');
      refreshData();

    } catch (err) {
      console.error("建立賣單失敗", err);
      
      let errorMessage = "建立賣單失敗：";
      if (err.message.includes("insufficient funds")) {
        errorMessage += "ETH 餘額不足以支付 gas 費用";
      } else if (err.message.includes("insufficient balance")) {
        errorMessage += "代幣餘額不足";
      } else if (err.message.includes("insufficient allowance")) {
        errorMessage += "授權額度不足";
      } else {
        errorMessage += err.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsListing(false);
    }
  };

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
      
      // 查詢每個代幣的餘額和細節
      const tokenPromises = properties.map(async (property) => {
        const tokenAddress = property.tokenAddress;
        const propertyName = property.name;
        
        try {
          const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
          
          const [name, symbol, balance, decimals, totalSupply] = await Promise.all([
            tokenContract.name(),
            tokenContract.symbol(),
            tokenContract.balanceOf(walletAddress),
            tokenContract.decimals(),
            tokenContract.totalSupply()
          ]);

          if (totalSupply === 0n) {
            return null;
          }
          
          const metadata = getPropertyMetadata(propertyName);
          const formattedBalance = parseFloat(ethers.formatUnits(balance, decimals));
          const estimatedValue = formattedBalance * 0.01 * 30000;
          const formattedTotalSupply = formatUnits(totalSupply, decimals);
          console.log('totalSupply', totalSupply)
          console.log('formattedTotalSupply', formattedTotalSupply);
          
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
            decimals: decimals,
            totalSupply: formattedTotalSupply
          };
        } catch (error) {
          console.error(`獲取代幣詳情失敗 ${tokenAddress}:`, error);
          return null;
        }
      });
      
      const tokenResults = (await Promise.all(tokenPromises)).filter(token => token !== null);
      console.log('tokenResults', tokenResults);
      const total = tokenResults.reduce((sum, token) => sum + token.value, 0);
      setTotalValue(total);
      setMyTokens(tokenResults);
    } catch (error) {
      console.error("獲取代幣資產錯誤", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 物業元數據獲取函數
  const getPropertyMetadata = (propertyName) => {
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
          <button className="refresh-button" onClick={refreshData} disabled={isLoading}>
            <span className="refresh-icon">↻</span>
            重新整理
          </button>
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
                    <th>總供應量</th>
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
                      <td>{parseFloat(item.totalSupply).toLocaleString()}</td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="action-button sell-button"
                            onClick={() => {
                              setListingToken(item);
                              setListingAmount('');
                              setListingPrice('');
                            }}
                            disabled={item.amount <= 0}
                          >
                            出售
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
      
      {/* 出售彈窗 */}
      {listingToken && (
        <div className="listing-modal">
          <div className="modal-content">
            <h3>出售 {listingToken.property}</h3>
            
            <div className="input-group">
              <label>出售數量:</label>
              <input 
                type="number" 
                placeholder="出售數量"
                value={listingAmount}
                onChange={(e) => setListingAmount(e.target.value)}
                max={listingToken.amount}
                step="0.0001"
                min="0"
              />
              <small>最大可售: {listingToken.amount.toFixed(6)}</small>
            </div>
            
            <div className="input-group">
              <label>每份價格 (ETH):</label>
              <input 
                type="number" 
                placeholder="每份價格 (ETH)"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                step="0.001"
                min="0"
              />
            </div>
            
            {listingAmount && listingPrice && (
              <div className="calculation">
                <div className="calc-row">
                  <span>出售數量:</span>
                  <span>{parseFloat(listingAmount).toFixed(6)} {listingToken.symbol}</span>
                </div>
                <div className="calc-row">
                  <span>單價:</span>
                  <span>{parseFloat(listingPrice).toFixed(6)} ETH</span>
                </div>
                <div className="calc-row total">
                  <span><strong>總價:</strong></span>
                  <span><strong>{(parseFloat(listingAmount) * parseFloat(listingPrice)).toFixed(6)} ETH</strong></span>
                </div>
              </div>
            )}
            
            <div className="modal-buttons">
              <button 
                onClick={() => setListingToken(null)} 
                className="cancel-button"
              >
                取消
              </button>
              <button 
                onClick={createListing} 
                className="confirm-button"
                disabled={isListing || !listingAmount || !listingPrice || parseFloat(listingAmount) <= 0 || parseFloat(listingPrice) <= 0}
              >
                {isListing ? "處理中..." : "建立賣單"}
              </button>
            </div>
            
            {isListing && (
              <div className="listing-progress">
                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
                <p>正在處理交易，請稍候...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAssets;