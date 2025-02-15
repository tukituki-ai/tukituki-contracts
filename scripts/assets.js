const { initWallet } = require('../deploy/util');
const hre = require("hardhat");
const BigNumber = require('bignumber.js');
let ethers = require('hardhat').ethers;


const ARBITRUM = {
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    weth: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    wbtc: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
    usdt: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    // arb: "0x912ce59144191c1204e64559fe8253a0e49e6548",

    aavePoolProvider: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",

    aWeth: "0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8",
    aUsdc: "0x724dc807b04555b71ed48a6896b6F41593b8C637",
    aWbtc: "0x078f358208685046a11c85e8ad32895ded33a249",
    aUsdt: "0x6ab707aca953edaefbc4fd23ba73294241490620",
    // aArb: "0x6533afac2e7bccb20dca161449a13a32d391fb00",

    compound: "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf",

    npmUniswap: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
}

const BASE = {
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    weth: "0x4200000000000000000000000000000000000006",


    aavePoolProvider: "0xe20fCBdBfFC4Dd138cE8b2E6FBb6CB49777ad64D",
    aWeth: "0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7",
    aUsdc: "0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB",

    uniswapNpm: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
}

const OPTIMISM = {
    weth: "0x4200000000000000000000000000000000000006",
    usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    usdt: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
    wbtc: "0x68f180fcce6836688e9084f035309e29bf0a2095",

    wsteth: "0x1f32b1c2345538c0c6f582fcb022739c4a194ebb",

    aavePoolProvider: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",

    aWbtc: "0x078f358208685046a11c85e8ad32895ded33a249",
    aWeth: "0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8",
    aUsdc: "0x625e7708f30ca75bfd92586e17077590c60eb4cd",
    aUsdt: "0x6ab707aca953edaefbc4fd23ba73294241490620",
    aWsteth: "0xc45a479877e1e9dfe9fcd4056c699575a1045daa",


    uniswapNpm: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
}

const AVALANCHE = {
    weth: "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab",
    usdc: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
    usdt: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7",
    wavax: "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
    wbtc: "0x50b7545627a5162f82a992c33b87adc75187b218",


    aavePoolProvider: "0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb",

    aWeth: "0xe50fa9b3c56ffb159cb0fca61f5c9d750e8128c8",
    aUsdc: "0x625e7708f30ca75bfd92586e17077590c60eb4cd",
    aUsdt: "0x6ab707aca953edaefbc4fd23ba73294241490620",
    aWavax: "0x6d80113e533a2c0fe82eabd35f1875dcea89ea97",
    aWbtc: "0x078f358208685046a11c85e8ad32895ded33a249",

    uniswapNpm: "0x655C406EBFa14EE2006250925e54ec43AD184f8B",
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
                case ARBITRUM.wbtc:
                    from = '0x2DF3ace03098deef627B2E78546668Dd9B8EB8bC';
                    break;
                case ARBITRUM.usdt:
                    from = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
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

function toE8(value) {
    return new BigNumber(value.toString()).times(new BigNumber(10).pow(8)).toFixed(0);
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

async function getPrice() {
    let params = { gasPrice: "1000000000", gasLimit: "30000000" };
    if (process.env.ETH_NETWORK === 'POLYGON') {
        params = { gasPrice: "60000000000", gasLimit: 15000000 };
    } else if (process.env.ETH_NETWORK === 'ARBITRUM') {
        params = { gasLimit: 25000000, gasPrice: "100000000" }; // gasPrice always 0.1 GWEI
    } else if (process.env.ETH_NETWORK === 'BSC') {
        params = { gasPrice: "3000000000", gasLimit: 15000000 }; // gasPrice always 3 GWEI
    } else if (process.env.ETH_NETWORK === "OPTIMISM") {
        params = { gasPrice: "1000000000", gasLimit: 10000000 }; // gasPrice always 0.001 GWEI
    } else if (process.env.ETH_NETWORK === 'BLAST') {
        params = { gasPrice: "10000000", gasLimit: "25000000" }; // todo
    } else if (process.env.ETH_NETWORK === 'ZKSYNC') {
        let { maxFeePerGas, maxPriorityFeePerGas } = await ethers.provider.getFeeData();
        return { maxFeePerGas, maxPriorityFeePerGas, gasLimit: 30000000 }
    } else if (process.env.ETH_NETWORK === 'BASE') {
        let gasPrice = await ethers.provider.getGasPrice();
        let percentage = gasPrice.mul(BigNumber.from('50')).div(100);
        gasPrice = gasPrice.add(percentage);
        return { gasPrice: gasPrice * 2, gasLimit: 30000000 }
    } else if (process.env.ETH_NETWORK === 'LINEA') {
        let gasPrice = await ethers.provider.getGasPrice();
        let percentage = gasPrice.mul(BigNumber.from('5')).div(100);
        gasPrice = gasPrice.add(percentage);
        return { gasPrice: gasPrice, gasLimit: 20000000 }
    }

    return params;
}

module.exports = {
    fromE18,
    fromE6,
    toE18,
    toE6,
    toE8,
    transferAsset,
    transferETH,
    getERC20ByAddress,
    ARBITRUM,
    BASE,
    OPTIMISM,
    AVALANCHE,
}