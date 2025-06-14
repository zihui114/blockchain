import React, { useState } from 'react';
import ElectionTab from './ElectionTab';
import ProposalTab from './ProposalTab';

const PropertyDAO = ({ tokenInfo, factoryContract, signer, walletAddress, onClose }) => {
  const [activeTab, setActiveTab] = useState('election');

  return (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2>房產 DAO 治理 - {tokenInfo?.propertyName}</h2>
        <button onClick={onClose} style={{ fontSize: 16 }}>← 返回</button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => setActiveTab('election')}
          style={{ marginRight: 12, padding: '8px 16px', backgroundColor: activeTab === 'election' ? '#ddd' : '#f5f5f5' }}
        >
          管理人選舉
        </button>
        <button
          onClick={() => setActiveTab('proposal')}
          style={{ padding: '8px 16px', backgroundColor: activeTab === 'proposal' ? '#ddd' : '#f5f5f5' }}
        >
          公共事項提案
        </button>
      </div>

      {activeTab === 'election' && <ElectionTab tokenInfo={tokenInfo} factoryContract={factoryContract} signer={signer} walletAddress={walletAddress} />}
      {activeTab === 'proposal' && <ProposalTab tokenInfo={tokenInfo} factoryContract={factoryContract} signer={signer} walletAddress={walletAddress} />}
    </div>
  );
};

export default PropertyDAO;
