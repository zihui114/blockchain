// utils/proposeUtils.ts

import { getDAOContractByToken } from "./daoUtils";

/**
 * 提名候選人
 * @param tokenAddress 代幣合約地址（用來找對應的 DAO 合約）
 * @param factoryContract Factory 合約實例
 * @param signer 用戶簽章者，用來呼叫 DAO 的函數
 * @param candidateAddress 被提名者的地址
 * @returns true 表示成功
 */
 
export const proposeCandidate = async (
  tokenAddress: string,
  factoryContract: any,
  signer: any,
  candidateAddress: string
): Promise<boolean> => {
  // 1. 根據代幣地址，找到對應的 DAO 合約，建立一個 DAO 合約 instance（此函式來自 /src/utils/daoUtils.ts）
  const daoContract = await getDAOContractByToken(tokenAddress, factoryContract, signer);

  // 2. 呼叫 proposeManager(address candidate) 函式進行投票（此函式來自 PropertyDAO.sol）
  const tx = await daoContract.proposeManager(candidateAddress);
  await tx.wait();
	
	console.log("✅ 提名成功！");
  return true;
};
