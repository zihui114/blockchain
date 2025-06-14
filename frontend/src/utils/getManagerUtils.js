import { getDAOContractByToken } from "./daoUtils";

/**
 * 查詢目前代管人（manager）地址
 * 有查到的話，直接回傳 manager 地址
 */
export const getManager = async (
  tokenAddress,
  factoryContract,
  signer
) => {
	// 1. 根據代幣地址，找到對應的 DAO 合約，建立一個 DAO 合約 instance（此函式來自 /src/utils/daoUtils.ts）
  const daoContract = await getDAOContractByToken(tokenAddress, factoryContract, signer);
  // 2. 直接回傳這個 DAO 合約的 manager address
  const manager = await daoContract.manager();
  
  console.log("✅ 查詢包租代管人成功！");
  return manager;
};
