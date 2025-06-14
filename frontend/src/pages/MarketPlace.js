import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './Marketplace.css';

// 導入 hook 和合約配置
import { useWalletConnection } from '../hooks/useWalletConnection';
import marketplaceAbi from '../contracts/PropertyMarketplace.json';
import tokenAbi from '../contracts/MyPropertyToken-abi.json';

const MARKETPLACE_ADDRESS = marketplaceAbi.address;

const Marketplace = () => {
  // 使用 wallet connection hook
  const { 
    walletConnected, 
    walletAddress, 
    provider, 
    signer, 
    connectWallet, 
    createContract 
  } = useWalletConnection();

  // 本地狀態
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [buyingListing, setBuyingListing] = useState(null);
  const [groupedListings, setGroupedListings] = useState({});
  const [openSymbol, setOpenSymbol] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);

  // 按代幣符號分組賣單
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
      const marketplaceContract = createContract(MARKETPLACE_ADDRESS, marketplaceAbi.abi);
      
      const [listingIds, sellers, tokenAddresses, amounts, prices] = await marketplaceContract.getActiveListings();
      
      const listingPromises = listingIds.map(async (listingId, index) => {
        const tokenAddress = tokenAddresses[index];
        const tokenContract = createContract(tokenAddress, tokenAbi);
        
        const [decimals, tokenName, tokenSymbol] = await Promise.all([
          tokenContract.decimals(),
          tokenContract.name(),
          tokenContract.symbol()
        ]);

        const amount = parseFloat(ethers.formatUnits(amounts[index], decimals));
        const pricePerToken = parseFloat(ethers.formatEther(prices[index]));
        
        return {
          listingId: listingId.toString(),
          tokenAddress,
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
      setListings(listingResults);
      setGroupedListings(groupListingsByTokenSymbol(listingResults));

    } catch (error) {
      console.error("獲取賣單失敗", error);
      alert("獲取賣單失敗，請檢查網絡連接");
    } finally {
      setIsLoading(false);
    }
  };

  // 購買代幣
  const buyTokens = async (listing) => {
    try {
      setBuyingListing(listing.listingId);
      
      const marketplaceContract = createContract(MARKETPLACE_ADDRESS, marketplaceAbi.abi, true);
      
      // 計算需要支付的總金額
      const totalValue = listing.originalAmount * listing.originalPrice / (10n ** 18n);
      
      const tx = await marketplaceContract.purchaseTokens(
        listing.listingId,
        listing.originalAmount,
        { value: totalValue }
      );
      
      await tx.wait();
      alert("購買成功！");
      fetchListings();
      
    } catch (error) {
      console.error("購買失敗:", error);
      alert(`購買失敗: ${error.message}`);
    } finally {
      setBuyingListing(null);
    }
  };

  // 當錢包連接狀態改變時重新獲取賣單
  useEffect(() => {
    if (walletConnected) {
      fetchListings();
    }
  }, [walletConnected]);

  // 渲染主要內容
  const renderContent = () => {
    if (!walletConnected) {
      return (
        <div className="connect-prompt">
          <p>請連接錢包以查看市場</p>
        </div>
      );
    }

    if (isLoading) {
      return <div className="loading">載入中...</div>;
    }

    if (selectedListing) {
      return (
        <div className="listing-detail">
          <button className="back-button" onClick={() => setSelectedListing(null)}>
            ← 返回賣單列表
          </button>
          <h3>賣單詳細資訊</h3>
          <p><strong>代幣名稱:</strong> {selectedListing.tokenName}</p>
          <p><strong>數量:</strong> {selectedListing.amount} {selectedListing.tokenSymbol}</p>
          <p><strong>單價:</strong> {selectedListing.pricePerToken} ETH</p>
          <p><strong>總價:</strong> {selectedListing.totalPrice} ETH</p>
          <p><strong>賣家地址:</strong> {selectedListing.seller}</p>
          <button
            className="buy-button"
            onClick={() => buyTokens(selectedListing)}
            disabled={
              buyingListing === selectedListing.listingId || 
              selectedListing.seller.toLowerCase() === walletAddress.toLowerCase()
            }
          >
            {buyingListing === selectedListing.listingId ? '購買中...' :
             selectedListing.seller.toLowerCase() === walletAddress.toLowerCase() ? '自己的賣單' : '購買'}
          </button>
        </div>
      );
    }

    if (openSymbol) {
      return (
        <div className="table-container">
          <button className="back-button" onClick={() => setOpenSymbol(null)}>
            ← 返回幣種列表
          </button>
          <h3>{openSymbol} 的賣單</h3>
          
          <table className="assets-table">
            <thead>
              <tr>
                <th>代幣名稱</th>
                <th>數量</th>
                <th>單價 (ETH)</th>
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
      );
    }

    return (
      <div className="listings-grouped">
        {Object.keys(groupedListings).map((symbol) => (
          <div key={symbol} className="token-box" onClick={() => setOpenSymbol(symbol)}>
            <div className="token-header" style={{ 
              cursor: 'pointer', 
              padding: '10px', 
              borderRadius: '8px', 
              marginBottom: '10px' 
            }}>
              <h3>{symbol}（{groupedListings[symbol].length} 筆賣單）</h3>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <h2>房地產市場</h2>
        {walletConnected ? (
          <div className="header-info">
            <button onClick={fetchListings} disabled={isLoading}>
              {isLoading ? '載入中...' : '重新整理'}
            </button>
          </div>
        ) : (
          <button onClick={connectWallet}>連接錢包</button>
        )}
      </div>
      {renderContent()}
    </div>
  );
};

export default Marketplace;