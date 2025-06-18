import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import daoConfig from "../contracts/IssueDAO.json"; // 從 go.cjs 匯出的 IssueDAO 合約地址與 ABI。
import tokenAbi from "../contracts/MyPropertyToken-abi.json"; // 從 MyPropertyToken 匯出的 ABI，用來查詢代幣餘額。

const ProposalTab = () => {
  const [proposalCount, setProposalCount] = useState(0); //負責連接 MetaMask。
  const [proposals, setProposals] = useState([]); // 所有提案的列表（從鏈上讀取）。
  const [newProposal, setNewProposal] = useState(""); //使用者輸入的新提案文字。
  const [signer, setSigner] = useState(null); //代表使用者，可以簽署交易。
  const [daoContract, setDaoContract] = useState(null); //IssueDAO 的合約實例。

  // ✅ 提取所有提案資料的函式
  // 對每個 proposalId 呼叫合約的 getProposal。
  // 將結果轉成前端需要的格式，存入 proposals 陣列。

  const loadProposals = async (dao) => {
    if (!dao) return;
    try {
      const count = await dao.getProposalCount();
      const loaded = [];
      for (let i = 0; i < count; i++) {
        const p = await dao.getProposal(i);
        loaded.push({
          id: i,
          content: p[0],
          votesFor: Number(p[1]),
          votesAgainst: Number(p[2]),
          finalized: p[3],
          passed: p[4],
          executed: p[5],
        });
      }
      setProposalCount(count);
      setProposals(loaded);
    } catch (err) {
      console.error("讀取提案失敗", err);
    }
  };

  // ✅ 初始化 provider 與合約
  useEffect(() => {
    const init = async () => {
      if (!window.ethereum) {
        alert("請安裝 MetaMask");
        return;
      }

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);

        // 確保使用者授權帳號
        await provider.send("eth_requestAccounts", []);

        const signer = await provider.getSigner();
        const dao = new ethers.Contract(
          daoConfig.address,
          daoConfig.abi,
          signer
        );

        setSigner(signer);
        setDaoContract(dao);
        await loadProposals(dao);
      } catch (error) {
        console.error("❌ 錯誤：無法取得 signer 或合約連線失敗", error);
        alert("⚠️ 請允許 MetaMask 授權，否則無法操作合約");
      }
    };

    init();
  }, []);

  // ✅ 提交新提案
  const submitProposal = async () => {
    if (!newProposal || !daoContract) return;
    try {
      const tx = await daoContract.createProposal(newProposal);
      await tx.wait(); // 等待交易上鏈
      setNewProposal("");
      const updatedCount = await daoContract.getProposalCount();
      await loadProposals(daoContract);
      setProposalCount(Number(updatedCount));
    } catch (err) {
      console.error("提案失敗:", err);
    }
  };

  // 投票。
  //id：提案 ID。support：布林值，代表是贊成（true）還是反對（false）。
  const handleVote = async (id, support) => {
    try {
      const tx = await daoContract.vote(id, support);
      await tx.wait(); // 等待鏈上交易完成
      await loadProposals(daoContract); // 🔁 重新讀取所有提案（包含該投票結果）
    } catch (err) {
      console.error("投票失敗:", err);
    }
  };

  // ✅ 開票
  const finalizeProposal = async (id) => {
    try {
      const tx = await daoContract.finalizeProposal(id);
      await tx.wait();
      await loadProposals(daoContract); // ✅ 重新載入所有提案資訊（包含 finalized / passed）
    } catch (err) {
      console.error("開票失敗:", err);
      alert(`開票失敗：${err.message}`);
    }
  };

  // ✅ 執行
  const executeProposal = async (id) => {
    try {
      const tx = await daoContract.executeProposal(id);
      await tx.wait();
      await loadProposals(daoContract); // ✅ 重新載入提案列表
    } catch (err) {
      console.error("執行失敗:", err);
      alert(`執行失敗：${err.message}`);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3>新增公共提案</h3>
        <textarea
          placeholder="請輸入提案內容"
          value={newProposal}
          onChange={(e) => setNewProposal(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />
        <button disabled={!newProposal} onClick={submitProposal}>
          提交提案
        </button>
      </div>

      <div>
        <h3>提案清單</h3>
        {proposals.length === 0 ? (
          <p>目前沒有提案</p>
        ) : (
          proposals.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #ddd",
                padding: 12,
                marginBottom: 12,
              }}
            >
              <p>
                <strong>#{p.id}</strong>：{p.content}
              </p>
              <p>
                贊成：{p.votesFor}，反對：{p.votesAgainst}
              </p>
              <p>
                狀態：
                {p.finalized
                  ? p.passed
                    ? "✅ 通過"
                    : "❌ 未通過"
                  : "🕒 尚未開票"}
              </p>
              <p>是否執行：{p.executed ? "✅ 已執行" : "❌ 未執行"}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleVote(p.id, true)}>贊成</button>
                <button onClick={() => handleVote(p.id, false)}>反對</button>
                <button onClick={() => finalizeProposal(p.id)}>開票</button>
                <button
                  onClick={() => executeProposal(p.id)}
                  disabled={!p.passed || p.executed}
                >
                  執行提案
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProposalTab;
