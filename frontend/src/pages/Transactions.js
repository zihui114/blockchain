import { useState, useEffect } from 'react';
import './Transactions.css';

const Transactions = () => {
  // 模擬交易數據
  const initialTransactions = [
    { 
      hash: '0x123f3c29a94fa9f52c6d1191e71957b5d37a47976af51ce4863fa3f5a1eb',
      from: '0xabc5493a5394a76c43aef4b3c30202ad1e752d3f',
      to: '0xdef9e4570a82ff6d15f7d0c5ca3f4a35366e4ced',
      amount: '3 ETH',
      tokenId: 'TP-12',
      propertyName: '台北豪宅',
      time: '2024/01/01 14:32:22',
      status: 'completed',
      type: 'transfer'
    },
    { 
      hash: '0x456612b6a44ac2ba05abff3a9b02b57b17b3367ceb9a26a37a6c21f07e7',
      from: '0x7891e52ca8cf4aa50a2ec48dd8ac73f2d40d7cbe',
      to: '0xabc5493a5394a76c43aef4b3c30202ad1e752d3f',
      amount: '2.5 ETH',
      tokenId: 'HK-08',
      propertyName: '高雄海景別墅',
      time: '2024/01/15 09:45:37', 
      status: 'completed',
      type: 'purchase'
    },
    { 
      hash: '0x789e8a27dd0eaca6c6df6bed7baee1c98ba5f8ffc68f4a0b29c9c00456d',
      from: '0xabc5493a5394a76c43aef4b3c30202ad1e752d3f',
      to: '0x123abc78defff456789012345678901a76b9c0ed',
      amount: '1.8 ETH',
      tokenId: 'TC-05',
      propertyName: '台中商辦大樓',
      time: '2024/02/03 16:21:45',
      status: 'pending',
      type: 'sale'
    },
    { 
      hash: '0xabcd3ff4a44fc8902de12ab34cd5678901234567db7a5f49db3c409a8b5',
      from: '0x0000000000000000000000000000000000000000',
      to: '0xabc5493a5394a76c43aef4b3c30202ad1e752d3f',
      amount: '5 ETH',
      tokenId: 'TP-15',
      propertyName: '台北豪宅',
      time: '2024/02/20 11:12:33',
      status: 'completed',
      type: 'mint'
    },
    { 
      hash: '0xef017b3ca5db456789abcdef01234567f6c890ab12ed345678901d4e5aa',
      from: '0xabc5493a5394a76c43aef4b3c30202ad1e752d3f',
      to: '0x7891e52ca8cf4aa50a2ec48dd8ac73f2d40d7cbe',
      amount: '0.5 ETH',
      tokenId: 'HK-03',
      propertyName: '高雄海景別墅',
      time: '2024/03/10 08:56:19',
      status: 'failed',
      type: 'transfer'
    }
  ];

  const [transactions, setTransactions] = useState(initialTransactions);
  const [filteredTransactions, setFilteredTransactions] = useState(initialTransactions);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    property: 'all',
    search: ''
  });

  const transactionsPerPage = 10;
  const pageCount = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const currentTransactions = filteredTransactions.slice(
    (currentPage - 1) * transactionsPerPage,
    currentPage * transactionsPerPage
  );

  // 處理過濾
  useEffect(() => {
    let results = transactions;
    
    if (filters.type !== 'all') {
      results = results.filter(tx => tx.type === filters.type);
    }
    
    if (filters.status !== 'all') {
      results = results.filter(tx => tx.status === filters.status);
    }
    
    if (filters.property !== 'all') {
      results = results.filter(tx => tx.propertyName === filters.property);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      results = results.filter(tx => 
        tx.hash.toLowerCase().includes(searchTerm) ||
        tx.from.toLowerCase().includes(searchTerm) ||
        tx.to.toLowerCase().includes(searchTerm) ||
        tx.tokenId.toLowerCase().includes(searchTerm)
      );
    }
    
    setFilteredTransactions(results);
    setCurrentPage(1); // 重設為第一頁
  }, [filters, transactions]);

  // 處理過濾器更改
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 獲取唯一的物業名稱列表
  const uniqueProperties = [...new Set(transactions.map(tx => tx.propertyName))];

  // 渲染交易類型標籤
  const renderTypeTag = (type) => {
    const typeClasses = {
      transfer: 'type-tag transfer',
      purchase: 'type-tag purchase',
      sale: 'type-tag sale',
      mint: 'type-tag mint'
    };
    
    const typeLabels = {
      transfer: '轉移',
      purchase: '購買',
      sale: '出售',
      mint: '鑄造'
    };
    
    return <span className={typeClasses[type]}>{typeLabels[type]}</span>;
  };

  // 渲染狀態標籤
  const renderStatusTag = (status) => {
    const statusClasses = {
      completed: 'status-tag completed',
      pending: 'status-tag pending',
      failed: 'status-tag failed'
    };
    
    const statusLabels = {
      completed: '已完成',
      pending: '處理中',
      failed: '失敗'
    };
    
    return <span className={statusClasses[status]}>{statusLabels[status]}</span>;
  };

  // 縮短地址顯示
  const shortenAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // 縮短交易哈希顯示
  const shortenHash = (hash) => {
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}`;
  };

  return (
    <div className="transactions-container">
      <h2 className="transactions-title">交易紀錄</h2>
      
      {/* 過濾器 */}
      <div className="filters-section">
        <div className="filter-row">
          <div className="filter-group">
            <label>交易類型</label>
            <select 
              value={filters.type} 
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">全部</option>
              <option value="transfer">轉移</option>
              <option value="purchase">購買</option>
              <option value="sale">出售</option>
              <option value="mint">鑄造</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>狀態</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">全部</option>
              <option value="completed">已完成</option>
              <option value="pending">處理中</option>
              <option value="failed">失敗</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>物業</label>
            <select 
              value={filters.property} 
              onChange={(e) => handleFilterChange('property', e.target.value)}
            >
              <option value="all">全部</option>
              {uniqueProperties.map(property => (
                <option key={property} value={property}>{property}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group search">
            <label>搜尋</label>
            <input 
              type="text" 
              placeholder="輸入交易哈希、地址或代幣ID" 
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* 交易列表 */}
      <div className="transactions-table-container">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>時間</th>
              <th>類型</th>
              <th>狀態</th>
              <th>交易哈希</th>
              <th>代幣ID</th>
              <th>物業</th>
              <th>從</th>
              <th>至</th>
              <th>數量</th>
            </tr>
          </thead>
          <tbody>
            {currentTransactions.length > 0 ? (
              currentTransactions.map((tx, i) => (
                <tr key={i} className="transaction-row">
                  <td>{tx.time}</td>
                  <td>{renderTypeTag(tx.type)}</td>
                  <td>{renderStatusTag(tx.status)}</td>
                  <td className="hash-cell">
                    <a href={`https://etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer">
                      {shortenHash(tx.hash)}
                    </a>
                  </td>
                  <td>{tx.tokenId}</td>
                  <td>{tx.propertyName}</td>
                  <td className="address-cell">
                    <a href={`https://etherscan.io/address/${tx.from}`} target="_blank" rel="noopener noreferrer">
                      {shortenAddress(tx.from)}
                    </a>
                  </td>
                  <td className="address-cell">
                    <a href={`https://etherscan.io/address/${tx.to}`} target="_blank" rel="noopener noreferrer">
                      {shortenAddress(tx.to)}
                    </a>
                  </td>
                  <td>{tx.amount}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-transactions">
                  沒有找到符合條件的交易紀錄
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* 分頁 */}
      {pageCount > 1 && (
        <div className="pagination">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            className="pagination-button"
          >
            上一頁
          </button>
          
          <span className="page-info">
            第 {currentPage} 頁，共 {pageCount} 頁
          </span>
          
          <button 
            disabled={currentPage === pageCount}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
            className="pagination-button"
          >
            下一頁
          </button>
        </div>
      )}
    </div>
  );
};

export default Transactions;