const fs = require("fs");
const path = require("path");

console.log("🚀 載入合約 ABI 和地址...\n");

try {
  // ✅ 載入 ABI
  const factoryAbi =
    require("../../blockchain-real-estate/out/PropertyTokenFactory.sol/PropertyTokenFactory.json").abi;
  const tokenAbi =
    require("../../blockchain-real-estate/out/MyPropertyToken.sol/MyPropertyToken.json").abi;
  const daoAbi =
    require("../../blockchain-real-estate/out/PropertyDAO.sol/PropertyDAO.json").abi;
  const marketplaceAbi =
    require("../../blockchain-real-estate/out/PropertyMarketPlace.sol/PropertyMarketplace.json").abi;
  const issueDaoAbi =
    require("../../blockchain-real-estate/out/IssueDAO.sol/IssueDAO.json").abi; // ✅ 新增

  // ✅ 載入部署記錄
  const deployment = require("../../blockchain-real-estate/broadcast/DeployScript.s.sol/31337/run-latest.json");

  // ✅ 取得指定合約地址
  const getContractAddress = (contractName) => {
    const tx = deployment.transactions.find(
      (tx) =>
        tx.contractName === contractName &&
        tx.contractAddress &&
        tx.transactionType === "CREATE"
    );
    return tx ? tx.contractAddress : null;
  };

  // ✅ 擷取合約地址
  const factoryAddress = getContractAddress("PropertyTokenFactory");
  const daoAddress = getContractAddress("PropertyDAO");
  const issueDaoAddress = getContractAddress("IssueDAO"); // ✅ 新增
  const marketplaceAddress = getContractAddress("PropertyMarketplace");

  console.log("📍 合約地址:");
  console.log("Factory:", factoryAddress);
  console.log("DAO:", daoAddress);
  console.log("IssueDAO:", issueDaoAddress); // ✅ 新增
  console.log("Marketplace:", marketplaceAddress);

  // ✅ 確保必要地址存在
  if (!factoryAddress || !marketplaceAddress) {
    throw new Error("缺少必要的合約地址");
  }

  // ✅ 檢查並創建目錄
  const outputDir = path.join(__dirname, "./src/contracts");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // ✅ 寫入 JSON 檔
  fs.writeFileSync(
    path.join(outputDir, "PropertyTokenFactory.json"),
    JSON.stringify({ address: factoryAddress, abi: factoryAbi }, null, 2)
  );

  fs.writeFileSync(
    path.join(outputDir, "MyPropertyToken-abi.json"),
    JSON.stringify(tokenAbi, null, 2)
  );

  if (daoAddress) {
    fs.writeFileSync(
      path.join(outputDir, "PropertyDAO.json"),
      JSON.stringify({ address: daoAddress, abi: daoAbi }, null, 2)
    );
  }

  if (issueDaoAddress) {
    fs.writeFileSync(
      path.join(outputDir, "IssueDAO.json"),
      JSON.stringify({ address: issueDaoAddress, abi: issueDaoAbi }, null, 2)
    );
  }

  fs.writeFileSync(
    path.join(outputDir, "PropertyMarketplace.json"),
    JSON.stringify(
      { address: marketplaceAddress, abi: marketplaceAbi },
      null,
      2
    )
  );

  console.log("✅ 所有文件保存成功!");
} catch (error) {
  console.error("❌ 錯誤:", error.message);
  console.log("\n🔧 請檢查:");
  console.log("1. Anvil 是否正在運行");
  console.log("2. 合約是否已正確部署");
  console.log("3. 文件路徑是否正確");
}
