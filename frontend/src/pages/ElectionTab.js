// ElectionTab.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import tokenAbi from '../contracts/MyPropertyToken-abi.json';

import { getDAOContractByToken } from '../utils/daoUtils';
import { proposeCandidate } from '../utils/proposeUtils';
import { voteForCandidate } from '../utils/voteUtils';
import { getCandidates } from '../utils/getCandidatesUtils';
import { finalizeElection } from '../utils/finalizeUtils';

const ElectionTab = ({ tokenInfo, factoryContract, signer, walletAddress }) => {
  const [manager, setManager] = useState('');
  const [candidates, setCandidates] = useState([]); // [{addr, votes}]
  const [newCandidate, setNewCandidate] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const tokenAddress = tokenInfo?.tokenAddress;

  // 讀取代幣合約中的 propertyManager
  const refreshManager = useCallback(async () => {
    if (!tokenAddress || !signer) return;
    try {
      const token = new ethers.Contract(tokenAddress, tokenAbi, signer);
      const m = await token.propertyManager();
      setManager(m);
    } catch (e) {
      console.error('讀取管理人失敗', e);
    }
  }, [tokenAddress, signer]);

  // 讀取 DAO 候選人與票數
  const refreshCandidates = useCallback(async () => {
    if (!tokenAddress || !factoryContract || !signer) return;

    try {
      const list = await getCandidates(tokenAddress, factoryContract, signer);
      const dao = await getDAOContractByToken(tokenAddress, factoryContract, signer);

      const enriched = await Promise.all(
        list.map(async (addr) => ({
          addr,
          votes: (await dao.votes(addr)).toString(),
        }))
      );
      setCandidates(enriched);
    } catch (e) {
      console.error('讀取候選人失敗', e);
    }
  }, [tokenAddress, factoryContract, signer]);

  useEffect(() => {
    refreshManager();
    refreshCandidates();
  }, [refreshManager, refreshCandidates]);

  const handlePropose = async () => {
    if (!ethers.isAddress(newCandidate)) return setMsg('⚠️ 地址格式不正確');
    try {
      setBusy(true);
      await proposeCandidate(tokenAddress, factoryContract, signer, newCandidate);
      setMsg('✅ 提名成功');
      setNewCandidate('');
      await refreshCandidates();
    } catch (e) {
      setMsg('❌ 提名失敗：' + (e.reason ?? e.message));
    } finally {
      setBusy(false);
    }
  };

  const handleVote = async () => {
    try {
      setBusy(true);
      await voteForCandidate(tokenAddress, selectedCandidate, factoryContract, signer);
      setMsg('✅ 投票成功');
      setSelectedCandidate('');
      await refreshCandidates();
    } catch (e) {
      setMsg('❌ 投票失敗：' + (e.reason ?? e.message));
    } finally {
      setBusy(false);
    }
  };

  const handleFinalize = async () => {
    try {
      setBusy(true);

      // 1. finalize DAO
      const dao = await getDAOContractByToken(tokenAddress, factoryContract, signer);
      await finalizeElection(tokenAddress, factoryContract, signer);

      // 2. 從 DAO 讀取投票勝出的新 manager
      const newManager = await dao.manager(); // 假設 DAO 合約有 public manager()，或你記得得票最高者

      // 3. 呼叫 token 合約的 setPropertyManager(newManager)
      const token = new ethers.Contract(tokenAddress, tokenAbi, signer);
      const tx = await token.setPropertyManager(newManager);
      await tx.wait();

      // 4. 更新狀態
      setMsg('✅ 結算完成，已更新管理人');
      await Promise.all([refreshManager(), refreshCandidates()]);
    } catch (e) {
      console.error('結算錯誤', e);
      setMsg('❌ 結算失敗：' + (e.reason ?? e.message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {/* 基本資訊 */}
      <div style={{ marginBottom: 24 }}>
        <p><strong>目前管理人:</strong> {manager || '讀取中...'}</p>
        <p><strong>您目前持有:</strong> {tokenInfo?.amount?.toFixed(2) || '0'} {tokenInfo?.symbol}</p>
      </div>

      {/* 提名 */}
      <div style={{ marginBottom: 24 }}>
        <h3>提名候選人</h3>
        <input
          value={newCandidate}
          onChange={(e) => setNewCandidate(e.target.value)}
          placeholder="輸入候選人地址"
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        <button onClick={handlePropose} disabled={busy || !newCandidate}>
          提名
        </button>
      </div>

      {/* 候選人清單與投票 */}
      <div style={{ marginBottom: 24 }}>
        <h3>候選人清單</h3>
        {candidates.length === 0 && <p>尚無候選人</p>}
        {candidates.map(({ addr, votes }, idx) => (
          <label key={idx} style={{ display: 'block', marginBottom: 8 }}>
            <input
              type="radio"
              name="candidate"
              value={addr}
              checked={selectedCandidate === addr}
              onChange={() => setSelectedCandidate(addr)}
              style={{ marginRight: 8 }}
            />
            {addr}（得票：{ethers.formatUnits(votes, tokenInfo.decimals)})
          </label>
        ))}
        <button onClick={handleVote} disabled={busy || !selectedCandidate}>
          確認投票
        </button>
      </div>

      {/* 結算選舉 */}
      <div style={{ marginBottom: 24 }}>
        <h3>選舉結算</h3>
        <button
          onClick={handleFinalize}
          disabled={busy || walletAddress?.toLowerCase() !== manager?.toLowerCase()}
        >
          完成選舉
        </button>
        {walletAddress?.toLowerCase() !== manager?.toLowerCase() && (
          <p style={{ color: '#888', fontSize: 12 }}>
            只有現任管理人可執行
          </p>
        )}
      </div>

      {/* 訊息 */}
      {msg && (
        <div style={{ background: '#f0f0f0', padding: 12, borderRadius: 6 }}>
          {msg}
        </div>
      )}
    </div>
  );
};

export default ElectionTab;
