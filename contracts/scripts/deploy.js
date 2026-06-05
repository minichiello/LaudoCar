const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    const LaudoCar = await ethers.getContractFactory("LaudoCar");
    const laudoCar = await LaudoCar.deploy();

    await laudoCar.waitForDeployment();

    const address = await laudoCar.getAddress();
    console.log("LaudoCar contract deployed to:", address);
    console.log("");
    console.log("==============================================");
    console.log("IMPORTANTE: Copie o endereço abaixo para o .env.local");
    console.log("NEXT_PUBLIC_CONTRACT_ADDRESS=", address);
    console.log("==============================================");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
