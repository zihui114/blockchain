import React, { useState, useEffect } from 'react';
import './Home.css';
import { ethers } from 'ethers';
import { useWalletConnection } from '../hooks/useWalletConnection';

// 顯示已創建的代幣的component
const CreatedTokenCard = ({ token }) => {
  return (
    <div className="created-token-card">
      <h3>{token.propertyName}</h3>
      <div className="token-details">
        <p><strong>代幣名稱:</strong> {token.tokenName}</p>
        <p><strong>代幣符號:</strong> {token.tokenSymbol}</p>
        <p><strong>初始供應量:</strong> {token.initialSupply}</p>
        <p><strong>代幣地址:</strong> 
          <a 
            href={`https://sepolia.etherscan.io/address/${token.tokenAddress}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="address-link"
          >
            {token.tokenAddress.slice(0, 6)}...{token.tokenAddress.slice(-4)}
          </a>
        </p>
      </div>
    </div>
  );
};

export default function Home() {
  // 使用 hook
  const { walletConnected, connectWallet, factoryContract } = useWalletConnection();
  
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [initialSupply, setInitialSupply] = useState('');
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [createdTokens, setCreatedTokens] = useState([]);

  // 獲取已創建的代幣
  const fetchCreatedTokens = async () => {
    if (!factoryContract) return;
    
    const properties = await factoryContract.getAllProperties();
    
    const enrichedTokens = await Promise.all(
      properties.map(async (p) => {
        const tokenContract = new ethers.Contract(
          p.tokenAddress,
          [
            "function name() view returns (string)",
            "function symbol() view returns (string)",
            "function totalSupply() view returns (uint256)",
            "function decimals() view returns (uint8)"
          ],
          factoryContract.runner
        );
        
        const tokenName = await tokenContract.name();
        const tokenSymbol = await tokenContract.symbol();
        const totalSupply = await tokenContract.totalSupply();
        const decimals = await tokenContract.decimals();
        
        return {
          propertyName: p.name,
          tokenAddress: p.tokenAddress,
          tokenName,
          tokenSymbol,
          initialSupply: ethers.formatUnits(totalSupply, decimals)
        };
      })
    );
    
    setCreatedTokens(enrichedTokens);
  };

  // 當合約實例設置後，獲取代幣列表
  useEffect(() => {
    if (factoryContract) {
      fetchCreatedTokens();
    }
  }, [factoryContract]);

  // 創建代幣
  const handleCreateToken = async () => {
    setIsCreatingToken(true);
    
    const supplyInteger = ethers.parseUnits(initialSupply, 18);
    
    const tx = await factoryContract.createPropertyToken(
      tokenName,
      tokenSymbol,
      propertyName,
      supplyInteger
    );
    
    await tx.wait();
    
    // 重置表單
    setTokenName('');
    setTokenSymbol('');
    setPropertyName('');
    setInitialSupply('');
    
    setIsCreatingToken(false);
    
    // 重新獲取代幣列表
    await fetchCreatedTokens();
  };

  return (
    <div className="home-container">
      {/* 錢包連接狀態 */}
      {walletConnected && (
        <div className="wallet-status">
          <p>✅ 錢包已連接</p>
        </div>
      )}

      {/* 創建代幣表單 */}
      <section className="create-property-section">
        <div className="section-header">
          <h2>新增房地產項目</h2>
        </div>
        <div className="create-property-form">
          <input 
            type="text" 
            placeholder="Token 名稱"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            disabled={isCreatingToken}
          />
          <input 
            type="text" 
            placeholder="Token 符號"
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            disabled={isCreatingToken}
          />
          <input 
            type="text" 
            placeholder="房產名稱"
            value={propertyName}
            onChange={(e) => setPropertyName(e.target.value)}
            disabled={isCreatingToken}
          />
          <input 
            type="number" 
            placeholder="初始供應量"
            value={initialSupply}
            onChange={(e) => setInitialSupply(e.target.value)}
            disabled={isCreatingToken}
          />
          <button 
            onClick={walletConnected ? handleCreateToken : connectWallet}
            disabled={isCreatingToken}
          >
            {!walletConnected ? '請先連接錢包' : 
              isCreatingToken ? '處理中...' : '創建代幣'}
          </button>
        </div>
      </section>

      {/* 已創建的代幣列表 */}
      {createdTokens.length > 0 && (
        <section className="created-tokens-section">
          <div className="section-header">
            <h2>我的房產代幣</h2>
          </div>
          <div className="created-tokens-grid">
            {createdTokens.map((token, index) => (
              <CreatedTokenCard key={index} token={token} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}