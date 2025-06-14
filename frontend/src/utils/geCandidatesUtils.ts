import { getDAOContractByToken } from "./daoUtils";

/**
 * 查詢目前所有候選人
 * @returns 候選人地址組成的陣列
 */
 
export const getCandidates = async (
  tokenAddress: string,
  factoryContract: any,
  signer: any
): Promise<string[]> => {

	// 1. 根據代幣地址，找到對應的 DAO 合約，建立一個 DAO 合約 instance（此函式來自 /src/utils/daoUtils.ts）
  const daoContract = await getDAOContractByToken(tokenAddress, factoryContract, signer);
  
  // 2. 此函式來自 PropertyDAO.sol
  const candidates: string[] = await daoContract.getCandidates();
  
   console.log("✅ 查詢候選人清單成功！");
  return candidates;
};

