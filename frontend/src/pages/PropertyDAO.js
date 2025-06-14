import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getDAOContractByToken } from '../utils/daoUtils';

const DAO_ABI = [
  "function manager() public view returns (address)",
  "function tokenAddress() public view returns (address)",
  "function votes(address) public view returns (uint256)",
  "function hasVoted(address) public view returns (bool)",
  "function proposeManager(address candidate) public",
  "function vote(address candidate) public",
  "function finalize() public",
  "function getCandidates() public view returns (address[])",
  "function owner() public view returns (address)"
];

const PropertyDAO = ({ 
  tokenInfo, 
  onClose, 
  signer,
  factoryContract,
  walletAddress
}) => {
  const [daoContract, setDaoContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manager, setManager] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState({});
  const [isOwner, setIsOwner] = useState(false);
  const [newCandidate, setNewCandidate] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const dao = await getDAOContractByToken(tokenInfo.tokenAddress, factoryContract, signer);
        const tokenAddr = await dao.tokenAddress();
        if (tokenAddr.toLowerCase() !== tokenInfo.tokenAddress.toLowerCase()) {
          alert('DAO 與代幣不符');
          onClose();
          return;
        }
        setDaoContract(dao);
        await loadDAOData(dao);
      } catch (err) {
        alert('無法取得 DAO 合約');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [tokenInfo, signer, factoryContract]);

  const loadDAOData = async (contract = daoContract) => {
    if (!contract) return;
    setLoading(true);
    try {
      const [currentManager, candidateList, userHasVoted, owner] = await Promise.all([
        contract.manager(),
        contract.getCandidates(),
        contract.hasVoted(walletAddress),
        contract.owner()
      ]);
      setManager(currentManager);
      setCandidates(candidateList);
      setHasVoted(userHasVoted);
      setIsOwner(owner.toLowerCase() === walletAddress.toLowerCase());
      const counts = await Promise.all(candidateList.map(c => contract.votes(c)));
      const voteMap = Object.fromEntries(
        candidateList.map((c, i) => [c, counts[i].toString()])
      );
      setVotes(voteMap);
    } catch (e) {
      console.error('載入 DAO 失敗:', e);
    } finally {
      setLoading(false);
    }
  };

  const proposeCandidate = async () => {
    if (!ethers.isAddress(newCandidate)) {
      alert('無效地址');
      return;
    }
    try {
      setLoading(true);
      const tx = await daoContract.proposeManager(newCandidate);
      await tx.wait();
      setNewCandidate('');
      await loadDAOData();
    } catch (e) {
      alert('提名失敗: ' + (e.reason || e.message));
    } finally {
      setLoading(false);
    }
  };

  const castVote = async () => {
    if (!selectedCandidate) {
      alert('請選擇候選人');
      return;
    }
    try {
      setLoading(true);
      const tx = await daoContract.vote(selectedCandidate);
      await tx.wait();
      setSelectedCandidate('');
      await loadDAOData();
    } catch (e) {
      alert('投票失敗: ' + (e.reason || e.message));
    } finally {
      setLoading(false);
    }
  };

  const finalizeElection = async () => {
    try {
      setLoading(true);
      const tx = await daoContract.finalize();
      await tx.wait();
      await loadDAOData();
    } catch (e) {
      alert('完成選舉失敗: ' + (e.reason || e.message));
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (addr) => {
    if (!addr || addr === ethers.ZeroAddress) return '無';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!daoContract) {
    return (
      <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '8px' }}>
        <p>正在載入 DAO...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2>房產 DAO 治理 - {tokenInfo.propertyName}</h2>
        <button onClick={onClose} style={{ fontSize: 16 }}>← 返回</button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <p><strong>代幣名稱:</strong> {tokenInfo.name}</p>
        <p><strong>代幣符號:</strong> {tokenInfo.symbol}</p>
        <p><strong>持有份數:</strong> {tokenInfo.amount.toFixed(4)} {tokenInfo.symbol}</p>
        <p><strong>管理人:</strong> {formatAddress(manager)}</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3>候選人列表</h3>
        {candidates.length === 0 ? (
          <p>尚無候選人</p>
        ) : (
          candidates.map((addr) => (
            <div key={addr} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>{formatAddress(addr)}</span>
              <span>{votes[addr] || '0'} 票</span>
            </div>
          ))
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3>提名候選人</h3>
        <input
          value={newCandidate}
          onChange={(e) => setNewCandidate(e.target.value)}
          placeholder="候選人地址"
          style={{ width: '100%', padding: 8, marginBottom: 8 }}
        />
        <button onClick={proposeCandidate} disabled={loading || !newCandidate}>提名</button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3>投票</h3>
        {hasVoted ? (
          <p>您已經投票</p>
        ) : tokenInfo.amount <= 0 ? (
          <p>您沒有投票權</p>
        ) : (
          <>
            {candidates.map((addr) => (
              <label key={addr} style={{ display: 'block', marginBottom: 4 }}>
                <input
                  type="radio"
                  name="vote"
                  value={addr}
                  checked={selectedCandidate === addr}
                  onChange={() => setSelectedCandidate(addr)}
                />
                {formatAddress(addr)}（{votes[addr] || '0'} 票）
              </label>
            ))}
            <button onClick={castVote} disabled={loading || !selectedCandidate}>確認投票</button>
          </>
        )}
      </div>

      {isOwner && candidates.length > 0 && (
        <div>
          <button onClick={finalizeElection} disabled={loading}>完成選舉</button>
        </div>
      )}
    </div>
  );
};

export default PropertyDAO;
