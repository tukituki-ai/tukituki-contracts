// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import {IPoolAddressesProvider, IPool} from "./interfaces/Aave.sol";
import {ICompound} from "./interfaces/Compound.sol";
import {INonfungiblePositionManager, TickMath, LiquidityAmounts, IUniswapV3Factory, IUniswapV3Pool} from "./interfaces/Uniswap.sol";

import "hardhat/console.sol";

contract Agent is AccessControlUpgradeable, UUPSUpgradeable, IERC721Receiver {
    IPoolAddressesProvider public aavePoolProvider;
    ICompound public compound;
    
    INonfungiblePositionManager public npmUniswap;

    IERC20 public usdc;
    IERC20 public weth;
    IERC20 public wbtc;
    mapping(address => address) public aToken;
    mapping(uint256 => address) public tokenIdToPool;

    // ---  constructor

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {}

    function initialize() initializer public {
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function _authorizeUpgrade(address newImplementation)
    internal
    onlyRole(DEFAULT_ADMIN_ROLE)
    override
    {}

    struct Args {
        address aavePoolProvider;
        address compound;
        address npmUniswap;
        
        address usdcToken;
        address aUsdcToken;
        address wethToken;
        address aWethToken;

        address wbtcToken;
        address aWbtcToken;
        
    }

    struct Balances {
        uint256 aaveWeth;
        uint256 aaveUsdc;
        uint256 aaveWbtc;
        uint256 compoundUsdc;
        
    }

    function setArgs(Args memory args) public {
        aavePoolProvider = IPoolAddressesProvider(args.aavePoolProvider);
        compound = ICompound(args.compound);
        npmUniswap = INonfungiblePositionManager(args.npmUniswap);
        usdc = IERC20(args.usdcToken);
        aToken[args.usdcToken] = args.aUsdcToken;
        
        weth = IERC20(args.wethToken);
        aToken[args.wethToken] = args.aWethToken;

        wbtc = IERC20(args.wbtcToken);
        aToken[args.wbtcToken] = args.aWbtcToken;
    }

    function supplyAave(uint256 amount, address token) public {
        IPool pool = IPool(aavePoolProvider.getPool());

        IERC20(token).approve(address(pool), amount);
        pool.supply(token, amount, address(this), 0);
    }

    function withdrawAave(uint256 amount, address token) public {
        IPool pool = IPool(aavePoolProvider.getPool());

        IERC20(aToken[token]).approve(address(pool), amount);
        pool.withdraw(token, amount, address(this));
    }

    function supplyCompound(uint256 amount, address token) public {
        IERC20(token).approve(address(compound), amount);
        compound.supply(token, amount);
    }

    // expected usual token
    function withdrawCompound(uint256 amount, address token) public {
        compound.withdraw(token, amount);
    }

    function depositUniswap(uint256 amount1, uint256 amount2, address token1, address token2, uint24 fee) public returns (uint256) {
        IERC20(token1).approve(address(npmUniswap), amount1);
        IERC20(token2).approve(address(npmUniswap), amount2);

        INonfungiblePositionManager.MintParams memory params =
            INonfungiblePositionManager.MintParams({
                token0: token1,
                token1: token2,
                fee: fee,
                tickLower: TickMath.MIN_TICK,
                tickUpper: TickMath.MAX_TICK,
                amount0Desired: amount1,
                amount1Desired: amount2,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp
            });

        (uint256 tokenId,,,) = npmUniswap.mint(params);
        tokenIdToPool[tokenId] = IUniswapV3Factory(npmUniswap.factory()).getPool(token1, token2, fee);
        return tokenId;
    }

    function withdrawUniswap(uint256 tokenId) public {
        npmUniswap.burn(tokenId);
    }

    function getAmounts(uint256 tokenId) public view returns (uint256 availableAmount, uint256 neededAmount) {
        (uint256 baseBalance, uint256 sideBalance) = getAmountsByToken(tokenId);
        return (baseBalance, sideBalance);
    }

    function getAmountsByToken(uint256 tokenId) public view returns (uint256 baseBalance, uint256 sideBalance) {
        if (tokenId > 0) {
            uint128 liquidity = getLiquidity(tokenId);
            if (liquidity > 0) {
                uint160 sqrtRatioX96 = getCurrentSqrtRatio(tokenId);
                (int24 tickLower, int24 tickUpper) = getPositionTicks(tokenId);
                uint160 sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(tickLower);
                uint160 sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(tickUpper);                
                (uint256 balance0, uint256 balance1) = LiquidityAmounts.getAmountsForLiquidity(sqrtRatioX96, sqrtRatioAX96, sqrtRatioBX96, liquidity);
                (baseBalance, sideBalance) = (balance1, balance0);
            }
        }
    }

    function getLiquidity(uint256 tokenId) public view returns (uint128 liquidity) {
        if (tokenId > 0) {
            (,,,,,,, liquidity,,,,) = npmUniswap.positions(tokenId);
        }
    }

    function getCurrentSqrtRatio(uint256 tokenId) public view returns (uint160 sqrtRatioX96) {
        (sqrtRatioX96,,,,,,) = IUniswapV3Pool(tokenIdToPool[tokenId]).slot0();
    }

    function getPositionTicks(uint256 tokenId) public view returns (int24 tickLower, int24 tickUpper) {
        if (tokenId > 0) {
            (,,,,, tickLower, tickUpper,,,,,) = npmUniswap.positions(tokenId);
        }
    }

    function balances() public view returns (Balances memory) {
        return Balances({
            aaveWeth: IERC20(aToken[address(weth)]).balanceOf(address(this)),
            aaveUsdc: IERC20(aToken[address(usdc)]).balanceOf(address(this)),
            aaveWbtc: IERC20(aToken[address(wbtc)]).balanceOf(address(this)),
            compoundUsdc: IERC20(address(compound)).balanceOf(address(this))
            
        });
    }


    function onERC721Received(address, address, uint256, bytes memory) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}