import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import { ethers } from 'ethers';
import factoryConfig from '../contracts/PropertyTokenFactory.json';
import EmojiPicker from 'emoji-picker-react';
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

// 載入畫面的component
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
    <p>載入中...</p>
  </div>
);


export default function Home() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  
  // 表單狀態
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [initialSupply, setInitialSupply] = useState('');
  
  // 合約狀態
  const [factoryContract, setFactoryContract] = useState(null);
  const [isCreatingToken, setIsCreatingToken] = useState(false);

  // 裡面存的是每一個已經創建的 token 的合約實例
  const [createdTokens, setCreatedTokens] = useState([]);
  
  // 新 Token 創建狀態
  const [lastCreatedToken, setLastCreatedToken] = useState(null);

  //emoji
  const [emoji, setEmoji] = useState('');

  const handleEmojiClick = (emojiData) => {
    setEmoji(prev => prev + emojiData.emoji);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
      //只是把每個property改名，把 name 改成 propertyName
      const formattedTokens = properties.map(p => ({
        propertyName: p.name,
        tokenAddress: p.tokenAddress  
      }));
      
      // 對於所有已存在的代幣，我們需要進一步查詢詳細資訊
      const enrichedTokens = await Promise.all(
        formattedTokens.map(async (token) => {
          try {
            //幫每個 token 建立一個合約的物件
            const tokenContract = new ethers.Contract(
              token.tokenAddress,
              // 使用簡化版的 ABI，只包含我們需要的函數
              [
                "function name() view returns (string)",
                "function symbol() view returns (string)",
                "function totalSupply() view returns (uint256)",
                "function decimals() view returns (uint8)"
              ],
              // 選擇使用跟factoryContract一樣的signer，這邊定義在162行
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

  //1. 處理連接錢包的合約
  const handleConnectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);//連接瀏覽器 metamask 的provider
        await provider.send("eth_requestAccounts", []);//provider送請求給 metaMask 要求連接帳戶
        const signer = await provider.getSigner();//provider 的 signer 用來讀寫鏈上資料的物件
        setWalletConnected(true);
        
        // 設置合約實例
        const contractAddress = factoryConfig.address;//拿 factory 的合約地址
        const contractABI = factoryConfig.abi;//拿 abi 物件
        const contractInstance = new ethers.Contract(contractAddress, contractABI, signer);//建立新的合約物件
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
//創建代幣
  const handleCreateToken = async () => {
    // 添加表單驗證
    if (!tokenName.trim()) {
      alert("請輸入代幣名稱");
      return;
    }
    
    if (!tokenSymbol.trim()) {
      alert("請輸入代幣符號");
      return;
    }
    
    if (!propertyName.trim()) {
      alert("請輸入房產名稱");
      return;
    }
    
    if (!initialSupply.trim()) {
      alert("請輸入初始供應量");
      return;
    }
    
    // 檢查初始供應量是否為有效數字
    const supplyNumber = parseFloat(initialSupply);
    if (isNaN(supplyNumber) || supplyNumber <= 0) {
      alert("初始供應量必須是大於 0 的數字");
      return;
    }
    
    const supplyInteger = ethers.parseUnits(supplyNumber.toString(), 18);

    setIsCreatingToken(true);
    //這裡是想辦法拿到 token 的地址
    try {
      const tx = await factoryContract.createPropertyToken(//直接調用合約裡寫好的創建代幣的好數就好ㄌ
        tokenName,
        tokenSymbol,
        propertyName,
        supplyInteger  // 使用轉換後的整數
      );
      
      console.log("Transaction hash:", tx.hash);
      
      // 等待交易確認。等待礦工幫我們確認交易
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      const propertyCreatedEvents = receipt.logs
        .filter(log => {
          try {
            const parsedLog = factoryContract.interface.parseLog(log);
            return parsedLog && parsedLog.name === 'PropertyCreated';
          } catch (e) {
            return false;
          }
        })
        .map(log => factoryContract.interface.parseLog(log));
      
      if (propertyCreatedEvents.length > 0) {
        const propertyCreatedEvent = propertyCreatedEvents[0];
        const createdPropertyName = propertyCreatedEvent.args[0];
        const createdTokenAddress = propertyCreatedEvent.args[1];
        
        // 驗證創建的代幣
        await verifyTokenCreation(createdTokenAddress, supplyInteger);
        
        setLastCreatedToken({
          propertyName: createdPropertyName,
          tokenAddress: createdTokenAddress,
          tokenName,
          tokenSymbol,
          initialSupply: supplyInteger
        });
        
        // 重置表單
        setTokenName('');
        setTokenSymbol('');
        setPropertyName('');
        setInitialSupply('');
        
        alert("代幣創建成功！");
        
        // 重新獲取代幣列表
        await fetchCreatedTokens();
      } else {
        console.error("找不到 PropertyCreated 事件");
        alert("代幣似乎已創建，但無法找到確認事件，請重新整理頁面查看");
      }
    } catch (error) {
      console.error("Error creating property token:", error);
      alert(`創建代幣失敗: ${error.message}`);
    } finally {
      setIsCreatingToken(false);
    }
  };
  
  // 添加代幣創建驗證函數
  const verifyTokenCreation = async (tokenAddress, expectedSupply) => {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function totalSupply() view returns (uint256)",
          "function decimals() view returns (uint8)",
          "function balanceOf(address) view returns (uint256)"
        ],
        factoryContract.runner
      );
      
      const totalSupply = await tokenContract.totalSupply();
      const decimals = await tokenContract.decimals();
      const userBalance = await tokenContract.balanceOf(await factoryContract.runner.getAddress());
      
      console.log("代幣驗證結果:", {
        tokenAddress,
        totalSupply: totalSupply.toString(),
        totalSupplyFormatted: ethers.formatUnits(totalSupply, decimals),
        expectedSupply,
        decimals,
        userBalance: userBalance.toString(),
        userBalanceFormatted: ethers.formatUnits(userBalance, decimals)
      });
      
      if (totalSupply === 0n) {
        throw new Error("代幣創建失敗：總供應量為 0");
      }
      
      if (userBalance === 0n) {
        throw new Error("代幣創建失敗：用戶餘額為 0");
      }
      
      return true;
    } catch (error) {
      console.error("代幣驗證失敗:", error);
      throw error;
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

  {/* emoji 選擇區塊 */}
  <div className="emoji-section">
    <label>選擇一個 Emoji 作為代幣符號：</label>
    <EmojiPicker onEmojiClick={(emojiData) => setTokenSymbol(emojiData.emoji)} />
    {tokenSymbol && <div className="emoji-preview">你選擇的是：{tokenSymbol}</div>}
  </div>

  <button 
    onClick={walletConnected ? handleCreateToken : handleConnectWallet}
    disabled={isCreatingToken || !tokenSymbol}
    className={`create-token-btn ${isCreatingToken ? 'loading' : ''}`}
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
    </div>
  );
}