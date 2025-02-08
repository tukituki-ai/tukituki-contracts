const { ethers, upgrades } = require('hardhat');
const hre = require('hardhat');
const { getImplementationAddress } = require('@openzeppelin/upgrades-core');
const sampleModule = require('@openzeppelin/hardhat-upgrades/dist/utils/deploy-impl');
const { getContract } = require('./script-utils');

async function getContract(name, network) {

    if (!network) network = process.env.STAND;

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

async function initWallet() {

    updateFeeData(hre);

    if (wallet) {
        return wallet;
    }

    let provider = ethers.provider;    
    networkName = process.env.NETWORK;
    wallet = new ethers.Wallet(process.env['PK'], provider);
    
    console.log('[User] Wallet: ' + wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log('[User] Balance wallet: ' + fromE18(balance.toString()));

    return wallet;
}

function toE18(value) {
    return new BigNumber(value.toString()).times(new BigNumber(10).pow(18)).toFixed(0);
}

function fromE18(value) {
    return Number.parseFloat(new BigNumber(value.toString()).div(new BigNumber(10).pow(18)).toFixed(3).toString());
}

function toE6(value) {
    return new BigNumber(value.toString()).times(new BigNumber(10).pow(6)).toFixed(0);
}

function fromE6(value) {
    return value / 10 ** 6;
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
    deployProxyMulti: deployProxyMulti,
};