// utils/daoUtils.ts

import { ethers } from "ethers"; // 引入 ethers.js 套件，用來跟區塊鏈互動的工具（例如建立合約實例、發送交易、格式轉換等），這裡用 ethers 去 call 區塊鏈合約
import daoAbi from "../contracts/PropertyDAO.json"; //這個路徑要再確認，把 PropertyDAO 合約的 ABI 匯入，包含：合約有哪些函式（vote()、finalize() 等，每個函式的參數、回傳值。

// 定義一個名叫 getDAOContractByToken 的 async 函式，根據某個 token 的地址，取得它對應的 DAO 合約物件。
// 參數：tokenAddress: 房產代幣的地址 ; factoryContract: 已經建立好的 Factory 合約物件（可以呼叫它的 getDAOByToken()）; signer: 使用者的錢包簽署人物件（前端與鏈互動時一定需要）
export const getDAOContractByToken = async (tokenAddress: string, factoryContract: any, signer: any) => {
  const daoAddress = await factoryContract.getDAOByToken(tokenAddress); // 呼叫 Factory 合約中的 getDAOByToken() 函式，查詢「這個代幣對應的 DAO 合約地址」，這行是跟鏈上的 Factory 合約互動，會回傳一個 address 字串
  if (!daoAddress || daoAddress === ethers.ZeroAddress) {
    throw new Error("DAO contract not found for this token");
  }
	
	// 根據 DAO 合約地址、ABI、和 signer 建立一個合約實例。
	// 這個合約實例就可以在前端呼叫 DAO 裡的函式，例如 vote()、finalize() 等。
  return new ethers.Contract(daoAddress, daoAbi.abi, signer);
};

// signer 補充：
// 如果你要：投票、提名、開票，這些會改變鏈上狀態的操作，就一定要有 signer，因為他需要用你的私鑰簽名交易。
// 傳 signer 的目的是讓你拿到的 contract 實例可以「代表你發送交易」或「讀資料」，不需要再重複設定。

// 回傳格式補充：
// getDAOContractByToken 回傳的是 DAO 合約 instance，定義在 util
// getDAOByToken 回傳的是 DAO 合約 address，定義在 factoryContract 的一個函式