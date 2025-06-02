import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
import './Marketplace.css';

// 導入合約配置
import marketplaceAbi from '../contracts/PropertyMarketplace.json';
import tokenAbi from '../contracts/MyPropertyToken-abi.json';

const MARKETPLACE_ADDRESS = marketplaceAbi.address;

const Marketplace = () => {
  const [listings, setListings] = useState([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [buyingListing, setBuyingListing] = useState(null);

  // 連接錢包
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        setWalletConnected(true);
        setWalletAddress(address);
        setProvider(provider);
      } else {
        alert("請安裝 MetaMask");
      }
    } catch (error) {
      alert(`連接錢包失敗: ${error.message}`);
    }
  };

  // 獲取所有賣單
  const fetchListings = async () => {
    if (!provider) return;
    
    try {
      setIsLoading(true);
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, marketplaceAbi.abi, provider);
      
      console.log("正在獲取活躍賣單...");
      const [listingIds, sellers, tokenAddresses, amounts, prices] = await marketplaceContract.getActiveListings();
      
      console.log("找到", listingIds.length, "個活躍賣單");
      console.log("賣單 IDs:", listingIds.map(id => id.toString()));
      console.log("代幣地址:", tokenAddresses);
      
      const listingPromises = listingIds.map(async (listingId, index) => {
        const tokenAddress = tokenAddresses[index];
        console.log(`處理賣單 ${listingId.toString()}, 代幣地址: ${tokenAddress}`);
        
        try {
          // 先檢查地址是否有合約代碼
          const code = await provider.getCode(tokenAddress);
          if (code === "0x") {
            console.error(`代幣地址 ${tokenAddress} 沒有部署合約`);
            return null;
          }
          
          const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
          
          // 分別嘗試每個函數調用，以便更好地調試
          let tokenName, tokenSymbol, decimals;
          
          try {
            tokenName = await tokenContract.name();
            console.log(`代幣名稱: ${tokenName}`);
          } catch (error) {
            console.error(`無法獲取代幣名稱 ${tokenAddress}:`, error.message);
            tokenName = "Unknown Token";
          }
          
          try {
            tokenSymbol = await tokenContract.symbol();
            console.log(`代幣符號: ${tokenSymbol}`);
          } catch (error) {
            console.error(`無法獲取代幣符號 ${tokenAddress}:`, error.message);
            tokenSymbol = "UNK";
          }
          
          try {
            decimals = await tokenContract.decimals();
            console.log(`代幣小數位數: ${decimals}`);
          } catch (error) {
            console.error(`無法獲取代幣小數位數 ${tokenAddress}:`, error.message);
            decimals = 18; // 默認值
          }
          
          const amount = parseFloat(ethers.formatUnits(amounts[index], decimals));
          const pricePerToken = parseFloat(ethers.formatEther(prices[index]));
          
          return {
            listingId: listingId.toString(),
            tokenAddress: tokenAddress,
            tokenName,
            tokenSymbol,
            seller: sellers[index],
            amount,
            pricePerToken,
            totalPrice: pricePerToken * amount,
            decimals,
            originalAmount: amounts[index],
            originalPrice: prices[index]
          };
        } catch (error) {
          console.error(`獲取賣單 ${listingId} 失敗:`, error);
          return null;
        }
      });
      
      const results = (await Promise.all(listingPromises)).filter(listing => listing !== null);
      console.log("成功處理的賣單:", results.length);
      setListings(results);
    } catch (error) {
      console.error("獲取賣單失敗", error);
      alert("獲取賣單失敗，請檢查網絡連接和合約地址");
    } finally {
      setIsLoading(false);
    }
  };

  const buyTokens = async (listing) => {
    try {
      setBuyingListing(listing.listingId);
      
      const signer = await provider.getSigner();
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, marketplaceAbi.abi, signer);
      
      console.log('=================== 完整交易調試 ===================');
      
      // 1. 基本賣單資訊
      console.log('📋 賣單基本資訊:');
      console.log('  listingId:', listing.listingId);
      console.log('  listingId type:', typeof listing.listingId);
      console.log('  tokenAddress:', listing.tokenAddress);
      console.log('  tokenName:', listing.tokenName);
      console.log('  tokenSymbol:', listing.tokenSymbol);
      console.log('  seller:', listing.seller);
      console.log('  decimals:', listing.decimals);
      
      // 2. 原始數據詳細分析
      console.log('🔢 原始合約數據:');
      console.log('  originalAmount:', listing.originalAmount);
      console.log('  originalAmount.toString():', listing.originalAmount.toString());
      console.log('  originalAmount type:', typeof listing.originalAmount);
      console.log('  originalPrice:', listing.originalPrice);
      console.log('  originalPrice.toString():', listing.originalPrice.toString());
      console.log('  originalPrice type:', typeof listing.originalPrice);
      
      // 3. 格式化顯示數據
      console.log('💰 前端顯示數據:');
      console.log('  amount (格式化):', listing.amount);
      console.log('  pricePerToken (格式化):', listing.pricePerToken);
      console.log('  totalPrice (格式化):', listing.totalPrice);
      
      // 4. 帳戶資訊
      const userAddress = await signer.getAddress();
      const balance = await provider.getBalance(userAddress);
      console.log('👤 帳戶資訊:');
      console.log('  用戶地址:', userAddress);
      console.log('  帳戶餘額 (wei):', balance.toString());
      console.log('  帳戶餘額 (ETH):', ethers.formatEther(balance));
      
      // 5. 各種計算方式的總價
      console.log('🧮 各種總價計算:');
      const calc1 = listing.originalAmount * listing.originalPrice / (10n ** 18n);
      const calc2 = listing.originalAmount * listing.originalPrice / (10n ** 36n);
      const calc3 = ethers.parseEther(listing.totalPrice.toString());
      const calc4 = listing.originalAmount * listing.originalPrice;
      
      console.log('  方式1 (÷10^18):', calc1.toString(), 'wei =', ethers.formatEther(calc1), 'ETH');
      console.log('  方式2 (÷10^36):', calc2.toString(), 'wei =', ethers.formatEther(calc2), 'ETH');
      console.log('  方式3 (前端totalPrice):', calc3.toString(), 'wei =', ethers.formatEther(calc3), 'ETH');
      console.log('  方式4 (直接相乘):', calc4.toString(), 'wei =', ethers.formatEther(calc4), 'ETH');
      
      // 6. 檢查合約狀態
      console.log('📄 合約狀態檢查:');
      try {
        const contractListing = await marketplaceContract.listings(listing.listingId);
        console.log('  合約中的賣單:', contractListing);
        console.log('  合約中seller:', contractListing.seller);
        console.log('  合約中amount:', contractListing.amount.toString());
        console.log('  合約中pricePerToken:', contractListing.pricePerToken.toString());
        console.log('  合約中isActive:', contractListing.isActive);
      } catch (error) {
        console.log('  無法讀取合約賣單:', error.message);
      }
      
      // 7. 交易參數最終確認
      const finalValue = listing.originalAmount * listing.originalPrice / (10n ** 18n);
      console.log('🚀 最終交易參數:');
      console.log('  參數1 - listingId:', listing.listingId);
      console.log('  參數2 - amount:', listing.originalAmount.toString());
      console.log('  參數3 - value:', finalValue.toString(), 'wei');
      console.log('  參數3 - value (ETH):', ethers.formatEther(finalValue));
      
      // 8. 餘額充足性檢查
      console.log('💳 餘額檢查:');
      console.log('  需要支付:', ethers.formatEther(finalValue), 'ETH');
      console.log('  帳戶餘額:', ethers.formatEther(balance), 'ETH');
      console.log('  餘額充足?', balance >= finalValue);
      console.log('  差額:', ethers.formatEther(balance - finalValue), 'ETH');
      
      console.log('🔍 估算 Gas:');
      try {
        const gasEstimate = await marketplaceContract.purchaseTokens.estimateGas(
          listing.listingId,
          listing.originalAmount,
          {
            value: finalValue
          }
        );
        console.log('  Gas 估算成功:', gasEstimate.toString());
      } catch (gasError) {
        console.log('  Gas 估算失敗:', gasError.message);
        console.log('  Gas 錯誤詳情:', gasError);
      }
      console.log('================================================');

      const tx = await marketplaceContract.purchaseTokens(
        listing.listingId,
        listing.originalAmount,
        {
          value: finalValue
        }
      );
      
      await tx.wait();
      alert("購買成功！");
      fetchListings();
      
    } catch (error) {
      console.error("🚨 完整錯誤資訊:", error);
      console.error("🚨 錯誤訊息:", error.message);
      if (error.transaction) {
        console.error("🚨 交易資料:", error.transaction);
      }
      if (error.receipt) {
        console.error("🚨 交易收據:", error.receipt);
      }
      alert(`購買失敗: ${error.message}`);
    } finally {
      setBuyingListing(null);
    }
  };

  useEffect(() => {
    if (walletConnected) {
      fetchListings();
    }
  }, [walletConnected]);

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <h2>房地產市場</h2>
        {walletConnected ? (
          <button onClick={fetchListings} disabled={isLoading}>
            {isLoading ? '載入中...' : '重新整理'}
          </button>
        ) : (
          <button onClick={connectWallet}>連接錢包</button>
        )}
      </div>

      {!walletConnected ? (
        <div className="connect-prompt">
          <p>請連接錢包以查看市場</p>
        </div>
      ) : isLoading ? (
        <div className="loading">載入中...</div>
      ) : (
        <div className="listings-grid">
          {listings.length > 0 ? (
            listings.map((listing) => (
              <div key={listing.listingId} className="listing-card">
                <h3>{listing.tokenName}</h3>
                <div className="listing-info">
                  <p><strong>數量:</strong> {listing.amount.toFixed(4)} {listing.tokenSymbol}</p>
                  <p><strong>單價:</strong> {listing.pricePerToken.toFixed(6)} ETH</p>
                  <p><strong>總價:</strong> {listing.totalPrice.toFixed(6)} ETH</p>
                  <p><strong>賣家:</strong> {`${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}`}</p>
                </div>
                <button
                  className="buy-button"
                  onClick={() => buyTokens(listing)}
                  disabled={buyingListing === listing.listingId || listing.seller.toLowerCase() === walletAddress.toLowerCase()}
                >
                  {buyingListing === listing.listingId ? '購買中...' : 
                   listing.seller.toLowerCase() === walletAddress.toLowerCase() ? '自己的賣單' : '購買'}
                </button>
              </div>
            ))
          ) : (
            <div className="no-listings">
              <p>目前沒有任何賣單</p>
              <Link to="/my-assets">前往我的資產</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Marketplace;