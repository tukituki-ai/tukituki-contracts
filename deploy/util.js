const { ethers, upgrades } = require('hardhat');
const hre = require('hardhat');
const { getImplementationAddress } = require('@openzeppelin/upgrades-core');
const path = require('path'),
    fs = require('fs');

const { fromE18 } = require('../scripts/assets');

let wallet = undefined;

async function getContract(name, network) {

    if (!network) network = (process.env.ETH_NETWORK).toLowerCase();

    let ethers = hre.ethers;
    let wallet = await initWallet();

    try {
        let searchPath = fromDir(require('app-root-path').path, path.join(network, name + ".json"));
        console.log(searchPath);
        let contractJson = JSON.parse(fs.readFileSync(searchPath));
        return await ethers.getContractAt(contractJson.abi, contractJson.address, wallet);
    } catch (e) {
        console.error(`Error: Could not find a contract named [${name}] in network: [${network}]`);
        throw new Error(e);
    }
}

function fromDir(startPath, filter) {


    if (!fs.existsSync(startPath)) {
        console.log("no dir ", startPath);
        return;
    }

    let files = fs.readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
        let filename = path.join(startPath, files[i]);
        let stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            let value = fromDir(filename, filter); //recurse
            if (value)
                return value;

        } else if (filename.endsWith(filter)) {
            // console.log('Fond: ' + filename)
            return filename;
        }
    }


}

async function initWallet() {

    // updateFeeData(hre);

    if (wallet) {
        return wallet;
    }

    let provider = ethers.provider;    
    networkName = process.env.ETH_NETWORK;
    wallet = new ethers.Wallet(process.env['PK'], provider);
    
    console.log('[User] Wallet: ' + wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log('[User] Balance wallet: ' + fromE18(balance.toString()));

    return wallet;
}


async function deployProxy(contractName, factoryName, deployments, save, params) {

    let factoryOptions;
    let unsafeAllow;
    let args;
    
    if (params) {
        factoryOptions = params.factoryOptions;
        unsafeAllow = params.unsafeAllow;
        args = params.args;
    }

    const contractFactory = await ethers.getContractFactory(factoryName, factoryOptions);


    // uncomment for force import
    // let proxyAddress = '';
    // await upgrades.forceImport(proxyAddress, contractFactory, {
    //     kind: 'uups',
    // });

    let proxy;
    try {
        proxy = await getContract(contractName);
    } catch (e) {}

    if (!proxy) {
        console.log(`Proxy ${contractName} not found`);
        proxy = await upgrades.deployProxy(contractFactory, args, {
            kind: 'uups',
            unsafeAllow: unsafeAllow,
        });
        console.log(`Deploy ${contractName} Proxy progress -> ` + proxy.address + ' tx: ' + proxy.deployTransaction.hash);
        await proxy.deployTransaction.wait();
    } else {
        console.log(`Proxy ${contractName} found -> ` + proxy.address);
    }

    let impl;
    let implAddress;
    // Deploy a new implementation and upgradeProxy to new;
    // You need have permission for role UPGRADER_ROLE;

    try {
        impl = await upgrades.upgradeProxy(proxy, contractFactory, { unsafeAllow: unsafeAllow, redeployImplementation: "always" });
    } catch (e) {
        console.log(e);
        impl = await upgrades.forceImport(proxy, contractFactory, { unsafeAllow: unsafeAllow, redeployImplementation: "always" });
    }
    implAddress = await getImplementationAddress(ethers.provider, proxy.address);
    console.log(`Deploy ${contractName} Impl done -> proxy [` + proxy.address + '] impl [' + implAddress + ']');
    

    if (impl && impl.deployTransaction) await impl.deployTransaction.wait();

    const artifact = await deployments.getExtendedArtifact(factoryName);
    artifact.implementation = implAddress;
    let proxyDeployments = {
        address: proxy.address,
        ...artifact,
    };

    await save(contractName, proxyDeployments);

    // Enable verification contract after deploy
    
    console.log(`Verify proxy [${proxy.address}] ....`);
    try {
        await hre.run('verify:verify', {
            address: proxy.address,
            constructorArguments: args,
        });
    } catch (e) {
        console.log(e);
    }
    console.log(`Verify impl [${implAddress}] ....`);
    await hre.run('verify:verify', {
        address: implAddress,
        constructorArguments: [],
    });
    

    return proxyDeployments;
}

module.exports = {
    deployProxy: deployProxy,
    initWallet: initWallet,
    getContract: getContract,
};