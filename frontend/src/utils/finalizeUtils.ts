// utils/finalizeUtils.ts

import { getDAOContractByToken } from "./daoUtils";

/**
 * 參數皆是呼叫 getDAOContractByToken 的必要參數
 * @returns true 表示成功
 */
export const finalizeElection = async (
  tokenAddress: string,
  factoryContract: any,
  signer: any
): Promise<boolean> => {
	// 1. 根據代幣地址，找到對應的 DAO 合約，建立一個 DAO 合約 instance（此函式來自 /src/utils/daoUtils.ts）
  const daoContract = await getDAOContractByToken(tokenAddress, factoryContract, signer);
  // 2. 此函式來自 PropertyDAO.sol
  const tx = await daoContract.finalize();
  await tx.wait();
  
  console.log("✅ 開票成功！");
  return true;
};
