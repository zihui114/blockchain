import { useState } from 'react';
import './MyAssets.css'; // 引入 CSS 文件

const MyAssets = () => {
  // 模擬資產數據
  const [myTokens, setMyTokens] = useState([
    { id: 1, property: '台北豪宅', amount: 10, value: 5000000, location: '信義區', image: '/api/placeholder/300/200' },
    { id: 2, property: '高雄海景別墅', amount: 5, value: 3000000, location: '鼓山區', image: '/api/placeholder/300/200' },
    { id: 3, property: '台中商辦大樓', amount: 8, value: 4000000, location: '西屯區', image: '/api/placeholder/300/200' }
  ]);

  // 計算總資產價值
  const totalValue = myTokens.reduce((sum, token) => sum + token.value, 0);
  
  // 排序功能
  const [sortKey, setSortKey] = useState('property');
  const [sortDirection, setSortDirection] = useState('asc');
  
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };
  
  const sortedTokens = [...myTokens].sort((a, b) => {
    if (sortDirection === 'asc') {
      return a[sortKey] > b[sortKey] ? 1 : -1;
    } else {
      return a[sortKey] < b[sortKey] ? 1 : -1;
    }
  });

  return (
    <div className="assets-container">
      <h2 className="assets-title">我的房地產資產</h2>
      
      <div className="assets-summary">
        <p className="total-value">總資產價值: NT$ {totalValue.toLocaleString()}</p>
      </div>
      
      <div className="table-container">
        <table className="assets-table">
          <thead>
            <tr>
              <th className="sortable-header" onClick={() => handleSort('property')}>
                物業名稱 {sortKey === 'property' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="sortable-header" onClick={() => handleSort('location')}>
                位置 {sortKey === 'location' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="sortable-header" onClick={() => handleSort('amount')}>
                持有份數 {sortKey === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="sortable-header" onClick={() => handleSort('value')}>
                價值 (NT$) {sortKey === 'value' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTokens.map((item) => (
              <tr key={item.id} className="table-row">
                <td>
                  <div className="property-info">
                    <img src={item.image} alt={item.property} className="property-image" />
                    <span>{item.property}</span>
                  </div>
                </td>
                <td>{item.location}</td>
                <td>{item.amount} 份</td>
                <td>{item.value.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="button-container">
        <button className="buy-button">
          購買更多份額
        </button>
        <button className="sell-button">
          出售份額
        </button>
      </div>
    </div>
  );
};

export default MyAssets;