
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';

// import { Link } from 'react-router-dom';
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
  const [groupedListings, setGroupedListings] = useState({});
  const [openSymbol, setOpenSymbol] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // 或 'desc'


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
  const groupListingsByTokenSymbol = (listings) => {
    return listings.reduce((acc, listing) => {
      const symbol = listing.tokenSymbol;
      if (!acc[symbol]) {
        acc[symbol] = [];
      }
      acc[symbol].push(listing);
      return acc;
    }, {});
  };


    // 獲取所有賣單
  const fetchListings = async () => {
    if (!provider) return;
    
    try {
      setIsLoading(true);
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, marketplaceAbi.abi, provider);
      
      const [listingIds, sellers, tokenAddresses, amounts, prices] = await marketplaceContract.getActiveListings();
      
      const listingPromises = listingIds.map(async (listingId, index) => {
        const tokenAddress = tokenAddresses[index];
                  
        const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);
        const decimals = await tokenContract.decimals();
        const tokenName = await tokenContract.name();
        const tokenSymbol = await tokenContract.symbol();

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
      });
      const listingResults = await Promise.all(listingPromises);
      console.log('讀取到的賣單：', listingResults)
      setListings(listingResults);
      setGroupedListings(groupListingsByTokenSymbol(listingResults));//加這個

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
      // 7. 交易參數最終確認
      const finalValue = listing.originalAmount * listing.originalPrice / (10n ** 18n);
      
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
  const handleSort = () => {
    // 切換排序方向
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
  
    // ② 只針對目前展開的幣種 (openSymbol) 做排序
    if (!openSymbol) return;          // 尚未點進幣種時不用動作
  
    // ③ 依新方向排序該幣種的賣單 (用 pricePerToken)
    const updatedGroup = [...groupedListings[openSymbol]].sort((a, b) =>
      newOrder === 'asc'
        ? a.pricePerToken - b.pricePerToken
        : b.pricePerToken - a.pricePerToken
    );
  
    // ④ 更新 groupedListings（其餘幣種陣列保持原樣）
    setGroupedListings(prev => ({
      ...prev,
      [openSymbol]: updatedGroup,
    }));
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
    ) : selectedListing ? (
      
      <div className="listing-detail">
        <button className="back-button" onClick={() => setSelectedListing(null)}>← 返回賣單列表</button>
        <h3>賣單詳細資訊</h3>
        <p><strong>代幣名稱:</strong> {selectedListing.tokenName}</p>
        <p><strong>數量:</strong> {selectedListing.amount} {selectedListing.tokenSymbol}</p>
        <p><strong>單價:</strong> {selectedListing.pricePerToken} ETH</p>
        <p><strong>總價:</strong> {selectedListing.totalPrice} ETH</p>
        <p><strong>賣家地址:</strong> {selectedListing.seller}</p>
        <button
          className="buy-button"
          onClick={() => buyTokens(selectedListing)}
          disabled={buyingListing === selectedListing.listingId || selectedListing.seller.toLowerCase() === walletAddress.toLowerCase()}
        >
          {buyingListing === selectedListing.listingId ? '購買中...' :
          selectedListing.seller.toLowerCase() === walletAddress.toLowerCase() ? '自己的賣單' : '購買'}
        </button>
      </div>
    ) : openSymbol ? (
      <div className="table-container">
  <button className="back-button" onClick={() => setOpenSymbol(null)}>← 返回幣種列表</button>
  <h3>{openSymbol} 的賣單</h3>
  
  <table className="assets-table">
    <thead>
      <tr>
        <th>代幣名稱</th>
        <th>數量</th>
        <th>單價 (ETH)
          <button onClick={handleSort} style={{ backgroundColor: '#F5F7FA', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {sortOrder === 'asc' ? '🔼' : '🔽'}
          </button>
        </th>
        <th>總價 (ETH)</th>
        <th>賣家</th>
        <th>操作</th>
      </tr>
    </thead>
    <tbody>
      {groupedListings[openSymbol].map((listing) => (
        <tr
          key={listing.listingId}
          className="table-row"
          onClick={() => setSelectedListing(listing)}
        >
          <td>{listing.tokenName}</td>
          <td>{listing.amount.toFixed(4)} {listing.tokenSymbol}</td>
          <td>{listing.pricePerToken.toFixed(6)}</td>
          <td>{listing.totalPrice.toFixed(6)}</td>
          <td>{`${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}`}</td>
          <td>
            <button className="action-button view-button">查看</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

    ) : (
      // ✅ 幣種總覽頁，只顯示 symbol 和賣單數
      <div className="listings-grouped">
        {Object.keys(groupedListings).map((symbol) => (
          <div key={symbol} className="token-box" onClick={() => setOpenSymbol(symbol)}>
            <div
              className="token-header"
              
              style={{ cursor: 'pointer', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}
            >
              <h3>{symbol}（{groupedListings[symbol].length} 筆賣單）</h3>
            </div>
          </div>
        ))}
      </div>
    )}
  

      
    </div>
  );
};

export default Marketplace;