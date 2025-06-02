const fs = require('fs');
const path = require('path');

console.log("🚀 載入合約 ABI 和地址...\n");

try {
  // 載入 ABI
  const factoryAbi = require('/Users/akiraeason/Desktop/blockchain/Solidity/real-estate/out/PropertyTokenFactory.sol/PropertyTokenFactory.json').abi;
  const tokenAbi = require('/Users/akiraeason/Desktop/blockchain/Solidity/real-estate/out/MyPropertyToken.sol/MyPropertyToken.json').abi;
  const daoAbi = require('/Users/akiraeason/Desktop/blockchain/Solidity/real-estate/out/PropertyDAO.sol/PropertyDAO.json').abi;
  const marketplaceAbi = require('/Users/akiraeason/Desktop/blockchain/Solidity/real-estate/out/PropertyMarketPlace.sol/PropertyMarketplace.json').abi;

  // 載入部署記錄
  const deployment = require('/Users/akiraeason/Desktop/blockchain/Solidity/real-estate/broadcast/DeployScript.s.sol/31337/run-latest.json');

  // 智能獲取合約地址 - 根據合約名稱匹配
  const getContractAddress = (contractName) => {
    const tx = deployment.transactions.find(tx => 
      tx.contractName === contractName && 
      tx.contractAddress && 
      tx.transactionType === 'CREATE'
    );
    return tx ? tx.contractAddress : null;
  };

  // 獲取各合約地址
  const factoryAddress = getContractAddress('PropertyTokenFactory');
  const daoAddress = getContractAddress('PropertyDAO');  
  const marketplaceAddress = getContractAddress('PropertyMarketplace');

  console.log("📍 合約地址:");
  console.log("Factory:", factoryAddress);
  console.log("DAO:", daoAddress);
  console.log("Marketplace:", marketplaceAddress);

  // 檢查必要的合約地址
  if (!factoryAddress || !marketplaceAddress) {
    throw new Error("缺少必要的合約地址");
  }

  // 確保輸出目錄存在
  const outputDir = path.join(__dirname, './src/contracts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 只寫入完整的配置文件（包含地址和ABI）
  fs.writeFileSync(
    path.join(outputDir, 'PropertyTokenFactory.json'),
    JSON.stringify({ address: factoryAddress, abi: factoryAbi }, null, 2)
  );

  fs.writeFileSync(
    path.join(outputDir, 'MyPropertyToken-abi.json'),
    JSON.stringify(tokenAbi, null, 2)
  );

  if (daoAddress) {
    fs.writeFileSync(
      path.join(outputDir, 'PropertyDAO.json'),
      JSON.stringify({ address: daoAddress, abi: daoAbi }, null, 2)
    );
  }

  fs.writeFileSync(
    path.join(outputDir, 'PropertyMarketplace.json'),
    JSON.stringify({ address: marketplaceAddress, abi: marketplaceAbi }, null, 2)
  );

  console.log("✅ 所有文件保存成功!");

} catch (error) {
  console.error("❌ 錯誤:", error.message);
  console.log("\n🔧 請檢查:");
  console.log("1. Anvil 是否正在運行");
  console.log("2. 合約是否已正確部署");
  console.log("3. 文件路徑是否正確");
}