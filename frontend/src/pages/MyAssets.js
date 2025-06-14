import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { formatUnits } from "ethers";
import { Link } from 'react-router-dom';
import './MyAssets.css';

// 導入合約配置和 hooks
import tokenAbi from '../contracts/MyPropertyToken-abi.json';
import marketplaceAbi from '../contracts/PropertyMarketplace.json';
import { useWalletConnection } from '../hooks/useWalletConnection';

// 導入 DAO 組件
import PropertyDAO from './PropertyDAO';

const MARKETPLACE_ADDRESS = marketplaceAbi.address;

const MyAssets = () => {
  // 使用 wallet connection hook
  const { 
    walletConnected, 
    walletAddress, 
    provider, 
    signer,
    factoryContract, 
    connectWallet,
    createContract 
  } = useWalletConnection();

  // 基本狀態變數
  const [myTokens, setMyTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  
  const [listingToken, setListingToken] = useState(null);
  const [listingAmount, setListingAmount] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [isListing, setIsListing] = useState(false);

  // DAO 相關狀態
  const [selectedDAOToken, setSelectedDAOToken] = useState(null);
  const [showDAO, setShowDAO] = useState(false);

  // 創建賣單函數
  const createListing = async () => {
    if (!listingToken || !listingAmount || !listingPrice) {
      alert("請完整輸入資料");
      return;
    }

    setIsListing(true);

    const marketplaceContract = createContract(MARKETPLACE_ADDRESS, marketplaceAbi.abi, true);
    const tokenContract = createContract(listingToken.tokenAddress, tokenAbi, true);

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

    await tx.wait();
    alert("賣單建立成功！");
    
    // 重置表單
    setListingToken(null);
    setListingAmount('');
    setListingPrice('');
    refreshData();
    setIsListing(false);
  };

  // 打開 DAO 介面
  const openDAO = (token) => {
    setSelectedDAOToken(token);
    setShowDAO(true);
  };

  // 關閉 DAO 介面
  const closeDAO = () => {
    setShowDAO(false);
    setSelectedDAOToken(null);
  };

  // 獲取代幣資產
  const fetchTokenAssets = async () => {
    if (!factoryContract || !provider || !walletAddress) return;
    
    setIsLoading(true);
    
    // 獲取所有房產代幣
    const properties = await factoryContract.getAllProperties();
    
    // 查詢每個代幣的餘額和細節
    const tokenPromises = properties.map(async (property) => {
      const tokenAddress = property.tokenAddress;
      
      const tokenContract = createContract(tokenAddress, tokenAbi, false);
      
      const [name, symbol, balance, decimals, totalSupply, propertyName] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.balanceOf(walletAddress),
        tokenContract.decimals(),
        tokenContract.totalSupply(),
        tokenContract.propertyName()
      ]);

      if (totalSupply === 0n) {
        return null;
      }
      
      const formattedBalance = parseFloat(ethers.formatUnits(balance, decimals));
      const formattedTotalSupply = formatUnits(totalSupply, decimals);
      
      return {
        id: tokenAddress,
        name: name,
        symbol: symbol,
        propertyName: propertyName,
        amount: formattedBalance,
        tokenAddress: tokenAddress,
        decimals: decimals,
        totalSupply: formattedTotalSupply
      };
    });
    
    const tokenResults = (await Promise.all(tokenPromises)).filter(token => token !== null);
    setMyTokens(tokenResults);
    setIsLoading(false);
  };

  // 重新載入所有資料
  const refreshData = () => {
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
          <button className="connect-wallet-button" onClick={connectWallet}>
            連接錢包
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
      ) : showDAO && selectedDAOToken ? (
        <PropertyDAO
          tokenInfo={selectedDAOToken}
          onClose={closeDAO}
          signer={signer}
          walletAddress={walletAddress}
          factoryContract={factoryContract}
        />
      ) : (
        <>
          <div className="wallet-summary">
            <div className="wallet-info">
              <p className="wallet-address">
                <span className="info-label">錢包地址:</span>
                <span className="address-text">{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</span>
              </p>
            </div>
            <div className="assets-summary">
              <p className="total-properties">您共持有 {myTokens.length} 個房產的所有權</p>
            </div>
          </div>
  
          {myTokens.length > 0 ? (
            <div className="table-container">
              <table className="assets-table">
                <thead>
                  <tr>
                    <th>代幣名稱</th>
                    <th>房產名稱</th>
                    <th>代碼</th>
                    <th>持有份數</th>
                    <th>總供應量</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {myTokens.map((item) => (
                    <tr key={item.id} className="table-row">
                      <td>{item.name}</td>
                      <td>{item.propertyName}</td>
                      <td>{item.symbol}</td>
                      <td>{item.amount.toFixed(4)} {item.symbol}</td>
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
                          <button 
                            className="action-button dao-button"
                            onClick={() => openDAO(item)}
                            title="參與房產治理投票"
                          >
                            DAO治理
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
  
      {listingToken && (
        <div className="listing-modal">
          <div className="modal-content">
            <h3>出售 {listingToken.name}</h3>
  
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