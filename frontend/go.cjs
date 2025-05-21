const fs = require('fs');
const path = require('path');

// 載入合約 ABI
const factoryAbi = require('/Users/akiraeason/Desktop/blockchain/Solidity/real-estate/out/PropertyTokenFactory.sol/PropertyTokenFactory.json').abi;
console.log("PropertyTokenFactory ABI loaded successfully");

const tokenAbi = require('/Users/akiraeason/Desktop/blockchain/Solidity/real-estate/out/MyPropertyToken.sol/MyPropertyToken.json').abi;
console.log("MyPropertyToken ABI loaded successfully");

const daoAbi = require('/Users/akiraeason/Desktop/blockchain/Solidity/real-estate/out/PropertyDAO.sol/PropertyDAO.json').abi;
console.log("PropertyDAO ABI loaded successfully");

const marketplaceAbi = require('/Users/akiraeason/Desktop/blockchain/Solidity/real-estate/out/PropertyMarketPlace.sol/PropertyMarketplace.json').abi;
console.log("PropertyMarketplace ABI loaded successfully");

// 載入部署記錄獲取地址
const deployment = require('/Users/akiraeason/Desktop/blockchain/Solidity/real-estate/broadcast/DeployScript.s.sol/31337/run-latest.json');

// 獲取合約地址
const factoryAddress = deployment.transactions[0].contractAddress;
console.log("PropertyTokenFactory address:", factoryAddress);

const daoAddress = deployment.transactions[2].contractAddress;
console.log("PropertyDAO address:", daoAddress);

const marketplaceAddress = deployment.transactions[3].contractAddress;
console.log("PropertyMarketplace address:", marketplaceAddress);

// 確保目錄存在
const outputDir = path.join(__dirname, './src/contracts');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 寫入 ABI 檔案
fs.writeFileSync(
  path.join(outputDir, 'PropertyTokenFactory-abi.json'),
  JSON.stringify(factoryAbi, null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'MyPropertyToken-abi.json'),
  JSON.stringify(tokenAbi, null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'PropertyDAO-abi.json'),
  JSON.stringify(daoAbi, null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'PropertyMarketplace-abi.json'),
  JSON.stringify(marketplaceAbi, null, 2)
);

// 寫入合約地址
fs.writeFileSync(
  path.join(outputDir, 'PropertyTokenFactory.json'),
  JSON.stringify({ 
    address: factoryAddress,
    abi: factoryAbi 
  }, null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'PropertyDAO.json'),
  JSON.stringify({ 
    address: daoAddress,
    abi: daoAbi 
  }, null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'PropertyMarketplace.json'),
  JSON.stringify({ 
    address: marketplaceAddress,
    abi: marketplaceAbi 
  }, null, 2)
);

console.log("All ABI and address files saved successfully!");