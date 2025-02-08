const { initWallet } = require('../deploy/util');
const hre = require("hardhat");
let ethers = require('hardhat').ethers;

let ARBITRUM = {
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    weth: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
}

let BASE = {
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    weth: "0x4200000000000000000000000000000000000006",
}

async function transferAsset(assetAddress, to, amount) {

    let from;
    switch (process.env.ETH_NETWORK) {
        case "ARBITRUM":
            switch (assetAddress) {
                case ARBITRUM.weth:
                    from = "0x1eed63efba5f81d95bfe37d82c8e736b974f477b";
                    break;
                case ARBITRUM.usdc:
                    from = '0xe68ee8a12c611fd043fb05d65e1548dc1383f2b9';
                    break;
                default:
                    throw new Error('Unknown asset address');
            }
            break;
        case "BASE":
            switch (assetAddress) {
                case BASE.usdc:
                    from = '0x3304E22DDaa22bCdC5fCa2269b418046aE7b566A';
                    break;
                case BASE.weth:
                    from = '0x621e7c767004266c8109e83143ab0Da521B650d6';
                    break

                default:
                    throw new Error('Unknown asset address');
            }
            break;
        default:
            throw new Error('Unknown mapping ETH_NETWORK');
    }

    await transferETH(1, from);

    let asset = await getERC20ByAddress(assetAddress);

    if (hre.network.name === 'localhost') {
        hre.ethers.provider = new hre.ethers.providers.JsonRpcProvider('http://localhost:8545')
    }

    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [from],
    });

    let account = await hre.ethers.getSigner(from);

    if (!amount) {
        amount = await asset.balanceOf(from);
    }
    await asset.connect(account).transfer(to, amount, await getPrice());
    
    await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [from],
    });

    let balance = await asset.balanceOf(to);

    let symbol = await asset.symbol();

    let fromAsset = (await asset.decimals()) === 18 ? fromE18 : fromE6;
    console.log(`[Node] Transfer asset: [${symbol}] balance: [${fromAsset(balance)}] from: [${from}] to: [${to}]`);
}

async function transferETH(amount, to) {
   
    let privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Ganache key
    let walletWithProvider = new ethers.Wallet(privateKey, hre.ethers.provider);
    
    await walletWithProvider.sendTransaction({
        to: to,
        value: ethers.utils.parseEther(amount + "")
    });
    

    console.log(`[Node] Transfer ETH [${fromE18(await hre.ethers.provider.getBalance(to))}] to [${to}]`);
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

async function getERC20ByAddress(address, wallet) {

    console.log("address in getERC20ByAddress: ", address);

    let ethers = hre.ethers;

    if (!wallet) {
        wallet = await initWallet();
    }

    const ERC20 = require("./abi/IERC20.json");

    return await ethers.getContractAt(ERC20, address, wallet);

}

module.exports = {
    fromE18,
    fromE6,
    toE18,
    toE6,
    transferAsset,
    transferETH,
    getERC20ByAddress,
}