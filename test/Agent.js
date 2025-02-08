const hre = require("hardhat");
const { deployments, ethers } = require('hardhat');
const { expect } = require("chai");
const chai = require("chai");
const { sharedBeforeEach } = require("./util");


chai.use(require('chai-bignumber')());

// to run test: yarn hardhat test test/Agent.js



const expectApproximately = (actual, expected, percent) => {
    const delta = expected * percent / 100;
    expect(actual).to.be.approximately(expected, delta);
};

const initializeTokens = async (address, account) => {
    await transferAsset(address, account.address);
    return await getERC20ByAddress(address, account);
};

describe("Agent: Test", function () {
    let agent;
    let account;

    sharedBeforeEach("Deploy and Setup", async () => {
        await hre.run("compile");

        await deployments.fixture(['Agent']);

        const signers = await ethers.getSigners();
        account = signers[0];

        agent = await ethers.getContract('Agent');
        console.log("agent", agent.address);

        await initializeTokens(ARBITRUM.weth, account);
        await initializeTokens(ARBITRUM.usdc, account);

        
    });

    it("should supply and withdraw from Aave", async () => {
        await agent.supplyAave(toE18(100), ARBITRUM.weth);
        await agent.withdrawAave(toE18(100), ARBITRUM.weth);
    });
});

