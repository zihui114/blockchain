// utils/voteUtils.ts

import { ethers } from "ethers";
import { getDAOContractByToken } from "./daoUtils";

// 這是一個匯出的函式 voteForCandidate，會被前端呼叫來幫使用者投票。
export const voteForCandidate = async (
  tokenAddress: string, // 哪個代幣的 DAO（每個代幣都有對應一個 DAO 合約）
  candidateAddress: string, // 使用者想投給哪個候選人的錢包地址
  factoryContract: any, // 你前面連好的 Factory 合約，可以透過他的函式，「使用 tokenAddress 查出對應 DAO」
  signer: any // 有權限發送交易的錢包對象（MetaMask 使用者）
) => {
  try {
    // 1. 根據代幣地址，找到對應的 DAO 合約，建立一個 DAO 合約 instance（此函式來自 /src/utils/daoUtils.ts）
    const daoContract = await getDAOContractByToken(tokenAddress, factoryContract, signer);

    // 2. 呼叫 vote(address candidate) 函式進行投票（此函式來自 PropertyDAO.sol）
    const tx = await daoContract.vote(candidateAddress);

    // 3. 等待交易完成
    await tx.wait();
    console.log("✅ 投票成功！");
  } catch (error) {
    console.error("❌ 投票失敗：", error);
    throw error;
  }
};
