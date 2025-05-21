import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { ethers } from 'ethers';
import factoryConfig from '../contracts/PropertyTokenFactory.json'; // 引入之前匯出的合約設定

// 模擬數據 - 實際項目中這些會從API獲取
const MOCK_FEATURED_PROPERTIES = [
  {
    id: 1,
    title: "台北信義區豪華公寓",
    location: "台北市信義區",
    price: "1,000,000",
    tokenPrice: "1,000",
    totalTokens: 1000,
    availableTokens: 650,
    imageUrl: "/assets/property1.jpg",
    annualReturn: "8.5%",
  },
  // 其他模擬數據...
];

const MOCK_PLATFORM_STATS = {
  totalInvestment: "32,500,000",
  totalUsers: "1,245",
  completedTransactions: "4,876",
  totalProperties: "21"
};

const PropertyCard = ({ property }) => {
  const navigate = useNavigate();
  
  const handlePropertyClick = () => {
    navigate(`/property/${property.id}`);
  };
  
  return (
    <div className="property-card" onClick={handlePropertyClick}>
      <div className="property-image">
        <img src={property.imageUrl} alt={property.title} />
        <div className="property-return">
          <span>{property.annualReturn} 年化收益</span>
        </div>
      </div>
      <div className="property-content">
        <h3>{property.title}</h3>
        <p className="property-location">{property.location}</p>
        <div className="property-details">
          <div className="property-price">
            <p className="detail-label">房產總價</p>
            <p className="detail-value">${property.price}</p>
          </div>
          <div className="property-token">
            <p className="detail-label">代幣價格</p>
            <p className="detail-value">${property.tokenPrice}</p>
          </div>
        </div>
        <div className="property-progress">
          <div className="progress-bar">
            <div 
              className="progress-filled" 
              style={{ width: `${(property.totalTokens - property.availableTokens) / property.totalTokens * 100}%` }}
            ></div>
          </div>
          <p className="progress-text">{property.availableTokens} / {property.totalTokens} 代幣可用</p>
        </div>
        <button className="property-button">查看詳情</button>
      </div>
    </div>
  );
};

// 新增一個顯示已創建代幣的組件
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

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>載入中...</p>
  </div>
);

const formatCurrency = (value) => {
  const numericValue = value.toString().replace(/[^0-9]/g, '');
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0
  }).format(Number(numericValue));
};

export default function Home() {
  const navigate = useNavigate();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [platformStats, setPlatformStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  
  // 表單狀態
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [initialSupply, setInitialSupply] = useState('');
  
  // 合約狀態
  const [factoryContract, setFactoryContract] = useState(null);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [createdTokens, setCreatedTokens] = useState([]);
  
  // 新 Token 創建狀態
  const [lastCreatedToken, setLastCreatedToken] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setFeaturedProperties(MOCK_FEATURED_PROPERTIES);
        setPlatformStats(MOCK_PLATFORM_STATS);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('無法加載數據，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 新增一個獲取已創建代幣的函數
  const fetchCreatedTokens = async () => {
    if (!factoryContract) return;
    
    try {
      const properties = await factoryContract.getAllProperties();
      const formattedTokens = properties.map(p => ({
        propertyName: p.name,
        tokenAddress: p.tokenAddress
      }));
      
      // 對於新創建的代幣，我們需要獲取更多信息
      const enrichedTokens = await Promise.all(
        formattedTokens.map(async (token) => {
          try {
            const tokenContract = new ethers.Contract(
              token.tokenAddress,
              // 使用簡化版的 ABI，只包含我們需要的函數
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
              ...token,
              tokenName,
              tokenSymbol,
              initialSupply: ethers.formatUnits(totalSupply, decimals)
            };
          } catch (error) {
            console.error(`Error fetching token details for ${token.tokenAddress}:`, error);
            return token;
          }
        })
      );
      
      setCreatedTokens(enrichedTokens);
    } catch (error) {
      console.error("Error fetching created tokens:", error);
    }
  };

  // 當合約實例變更時，獲取已創建的代幣
  useEffect(() => {
    if (factoryContract) {
      fetchCreatedTokens();
      
      // 監聽新代幣創建事件
      const propertyCreatedFilter = factoryContract.filters.PropertyCreated();
      factoryContract.on(propertyCreatedFilter, (propertyName, tokenAddress) => {
        console.log(`New token created: ${propertyName} at ${tokenAddress}`);
        fetchCreatedTokens(); // 重新獲取代幣列表
      });
      
      // 清理函數
      return () => {
        factoryContract.removeAllListeners(propertyCreatedFilter);
      };
    }
  }, [factoryContract]);

  const handleStartInvesting = () => {
    if (isAuthenticated) {
      navigate('/marketplace');
    } else {
      navigate('/login');
    }
  };

  const handleViewAllProperties = () => {
    navigate('/marketplace');
  };

  const handleConnectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        setWalletConnected(true);
        
        // 設置合約實例
        const contractAddress = factoryConfig.address;
        const contractABI = factoryConfig.abi;
        const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);
        setFactoryContract(contractInstance);
        
        // 獲取已創建的代幣
        fetchCreatedTokens();
      } else {
        alert("請安裝 MetaMask 或其他 Web3 錢包擴充功能");
      }
    } catch (error) {
      console.error("錢包連接錯誤", error);
      setWalletConnected(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(!isAuthenticated);
  };

  const handleCreateToken = async () => {
    if (!factoryContract) {
      alert("請先連接錢包");
      return;
    }
    
    if (!tokenName || !tokenSymbol || !propertyName || !initialSupply) {
      alert("請填寫所有欄位");
      return;
    }
    
    setIsCreatingToken(true);
    
    try {
      const tx = await factoryContract.createPropertyToken(
        tokenName,
        tokenSymbol,
        propertyName,
        initialSupply
      );
      
      alert("交易已提交，等待確認...");
      console.log("Transaction hash:", tx.hash);
      
      // 等待交易確認
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      // 查找創建事件
      const propertyCreatedEvent = receipt.logs
        .filter(log => log.topics[0] === factoryContract.interface.getEvent('PropertyCreated').fragment.topicHash)
        .map(log => factoryContract.interface.parseLog({ topics: log.topics, data: log.data }))
        .find(event => event?.name === 'PropertyCreated');
      
      if (propertyCreatedEvent) {
        const { 0: createdPropertyName, 1: createdTokenAddress } = propertyCreatedEvent.args;
        
        // 設置最新創建的代幣
        setLastCreatedToken({
          propertyName: createdPropertyName,
          tokenAddress: createdTokenAddress,
          tokenName,
          tokenSymbol,
          initialSupply
        });
        
        // 重置表單
        setTokenName('');
        setTokenSymbol('');
        setPropertyName('');
        setInitialSupply('');
        
        alert("代幣創建成功！");
        
        // 重新獲取代幣列表
        await fetchCreatedTokens();
      }
    } catch (error) {
      console.error("Error creating property token:", error);
      alert(`創建代幣失敗: ${error.message}`);
    } finally {
      setIsCreatingToken(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>發生錯誤</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="secondary-button">
          重試
        </button>
      </div>
    );
  }

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>房地產代幣化投資平台</h1>
          <p className="hero-subtitle">
            透過區塊鏈技術，以小額投資方式參與高價值房地產市場
          </p>
          <div className="hero-buttons">
            <button className="primary-button" onClick={handleStartInvesting}>
              立即開始投資
            </button>
            {!isAuthenticated && (
              <button 
                className="secondary-button outline" 
                onClick={() => navigate('/learn-more')}
              >
                了解更多
              </button>
            )}
          </div>
        </div>
        <div className="wallet-connect-container">
          <button 
            className={`wallet-button ${walletConnected ? 'connected' : ''}`} 
            onClick={handleConnectWallet}
          >
            {walletConnected ? '錢包已連接' : '連接錢包'}
          </button>
          <button 
            className={`auth-button ${isAuthenticated ? 'authenticated' : ''}`} 
            onClick={handleLogin}
          >
            {isAuthenticated ? '已登入' : '登入/註冊'}
          </button>
        </div>
      </section>

      <section className="stats-section">
        <div className="section-header">
          <h2>平台數據</h2>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>總投資額</h3>
            <p className="stat-value">{formatCurrency(platformStats.totalInvestment)}</p>
          </div>
          <div className="stat-card">
            <h3>註冊用戶</h3>
            <p className="stat-value">{platformStats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h3>完成交易</h3>
            <p className="stat-value">{platformStats.completedTransactions}</p>
          </div>
          <div className="stat-card">
            <h3>上線房產</h3>
            <p className="stat-value">{platformStats.totalProperties}</p>
          </div>
        </div>
      </section>

      {/* 新增房地產表單區塊 */}
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
            onClick={walletConnected ? handleCreateToken : handleConnectWallet}
            disabled={isCreatingToken}
            className={isCreatingToken ? 'loading' : ''}
          >
            {!walletConnected ? '請先連接錢包' : 
              isCreatingToken ? '處理中...' : '創建代幣'}
          </button>
        </div>
      </section>

      {/* 顯示最後創建的代幣 */}
      {lastCreatedToken && (
        <section className="last-created-token-section">
          <div className="section-header">
            <h2>最新創建的代幣</h2>
          </div>
          <div className="token-success-message">
            <div className="success-icon">✓</div>
            <p>恭喜！您已成功創建新的房產代幣</p>
          </div>
          <CreatedTokenCard token={lastCreatedToken} />
        </section>
      )}

      {/* 顯示已創建的代幣列表 */}
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

      <section className="featured-properties">
        <div className="section-header">
          <h2>精選房產項目</h2>
          {featuredProperties.length > 0 && (
            <p className="section-description">探索我們精心挑選的高品質房地產投資機會</p>
          )}
        </div>
        
        {featuredProperties.length > 0 ? (
          <>
            <div className="property-grid">
              {featuredProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
            <div className="view-all-container">
              <button 
                className="secondary-button" 
                onClick={handleViewAllProperties}
              >
                查看全部房產
              </button>
            </div>
          </>
        ) : (
          <div className="no-properties">
            <p>目前沒有可用的房產項目，請稍後再查看</p>
          </div>
        )}
      </section>

      <section className="how-it-works">
        <div className="section-header">
          <h2>如何投資房地產代幣</h2>
        </div>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>註冊帳戶</h3>
            <p>完成身份驗證，連接數位錢包</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>選擇房產</h3>
            <p>瀏覽房產清單，查看詳細資訊</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>購買代幣</h3>
            <p>決定投資金額，購買房產代幣</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>收取收益</h3>
            <p>定期獲得租金收入，享受資產增值</p>
          </div>
        </div>
      </section>
    </div>
  );
}