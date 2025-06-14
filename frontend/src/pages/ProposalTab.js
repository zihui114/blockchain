import React, { useState } from 'react';

const ProposalTab = () => {
  const [newProposal, setNewProposal] = useState('');
  const [proposals, setProposals] = useState([
    { id: 1, content: '購買社區保全設備', votesFor: 5, votesAgainst: 2 },
    { id: 2, content: '更換電梯廣告廠商', votesFor: 3, votesAgainst: 4 },
  ]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3>新增公共提案</h3>
        <textarea
          placeholder="請輸入提案內容"
          value={newProposal}
          onChange={(e) => setNewProposal(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        <button disabled={!newProposal}>提交提案</button>
      </div>

      <div>
        <h3>提案清單</h3>
        {proposals.length === 0 ? (
          <p>目前沒有提案</p>
        ) : (
          proposals.map((p) => (
            <div key={p.id} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}>
            <p><strong>#{p.id}：</strong>{p.desc}</p>
            <p>贊成：{p.forVotes}，反對：{p.againstVotes}</p>
            <p>截止時間：{p.deadline}</p>
            {!p.executed ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button>贊成</button>
                <button>反對</button>
                <button>執行提案</button>
              </div>
            ) : (
              <span style={{ color: 'green' }}>✅ 已執行</span>
            )}
          </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProposalTab;
