import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

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
  {
    id: 2,
    title: "台中七期住宅大樓",
    location: "台中市西屯區",
    price: "800,000",
    tokenPrice: "800",
    totalTokens: 1000,
    availableTokens: 400,
    imageUrl: "/assets/property2.jpg",
    annualReturn: "7.2%",
  },
  {
    id: 3,
    title: "高雄海景豪宅",
    location: "高雄市鼓山區",
    price: "1,200,000",
    tokenPrice: "1,200",
    totalTokens: 1000,
    availableTokens: 800,
    imageUrl: "/assets/property3.jpg",
    annualReturn: "9.1%",
  }
];

const MOCK_PLATFORM_STATS = {
  totalInvestment: "32,500,000",
  totalUsers: "1,245",
  completedTransactions: "4,876",
  totalProperties: "21"
};

// 簡單的PropertyCard組件 (直接內置，而不是引入)
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

// 簡單的載入組件
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>載入中...</p>
  </div>
);

// 格式化工具
const formatCurrency = (value) => {
  // 移除非數字字符
  const numericValue = value.toString().replace(/[^0-9]/g, '');
  // 轉換為數字並格式化
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

  useEffect(() => {
    // 模擬API調用
    const fetchData = async () => {
      try {
        // 模擬網絡延遲
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

  const handleConnectWallet = () => {
    // 模擬錢包連接
    setWalletConnected(!walletConnected);
  };

  const handleLogin = () => {
    // 模擬登入
    setIsAuthenticated(!isAuthenticated);
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

      <section className="benefits-section">
        <div className="section-header">
          <h2>代幣化房地產的優勢</h2>
        </div>
        <div className="benefits-grid">
          <div className="benefit-card">
            <h3>降低門檻</h3>
            <p>小額投資即可參與高價值房地產市場</p>
          </div>
          <div className="benefit-card">
            <h3>流動性高</h3>
            <p>代幣可自由交易，無需等待房產出售</p>
          </div>
          <div className="benefit-card">
            <h3>透明公開</h3>
            <p>區塊鏈技術確保所有交易記錄公開透明</p>
          </div>
          <div className="benefit-card">
            <h3>多元分散</h3>
            <p>可投資多種不同地區、類型的房地產</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>開始您的房地產投資之旅</h2>
          <p>現在就加入我們，以更智能的方式投資房地產</p>
          <button className="primary-button" onClick={handleStartInvesting}>
            立即開始
          </button>
        </div>
      </section>
    </div>
  );
}