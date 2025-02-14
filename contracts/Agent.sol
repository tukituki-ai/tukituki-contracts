// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;
pragma abicoder v2;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

import {IPoolAddressesProvider, IPool} from "./interfaces/Aave.sol";
import {INonfungiblePositionManager, TickMath, LiquidityAmounts, IUniswapV3Factory, IUniswapV3Pool} from "./interfaces/Uniswap.sol";

import "hardhat/console.sol";

contract Agent is AccessControlUpgradeable, UUPSUpgradeable, IERC721Receiver {
    IPoolAddressesProvider public aavePoolProvider;
    
    INonfungiblePositionManager public npmUniswap;

    IERC20 public usdc;
    IERC20 public weth;
    IERC20 public wbtc;
    IERC20 public usdt;

    mapping(address => address) public aToken;
    mapping(uint256 => address) public tokenIdToPool;

    mapping(address => mapping(address => uint256)) public userAaveBalances;
    mapping(uint256 => address) public tokenIdToUser;
    mapping(address => uint256[]) public userTokenIds;
    


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
        address npmUniswap;
        
        address usdcToken;
        address aUsdcToken;
        address wethToken;
        address aWethToken;

        address usdtToken;
        address aUsdtToken;

        address wbtcToken;
        address aWbtcToken;
    }

    struct Balances {
        uint256 aaveWeth;
        uint256 aaveUsdc;
        uint256 aaveWbtc;
        uint256 aaveUsdt;
        uint256[] tokenIds;
    }

    function setArgs(Args memory args) public {
        aavePoolProvider = IPoolAddressesProvider(args.aavePoolProvider);
        npmUniswap = INonfungiblePositionManager(args.npmUniswap);

        usdc = IERC20(args.usdcToken);
        aToken[args.usdcToken] = args.aUsdcToken;
        
        weth = IERC20(args.wethToken);
        aToken[args.wethToken] = args.aWethToken;

        wbtc = IERC20(args.wbtcToken);
        aToken[args.wbtcToken] = args.aWbtcToken;

        usdt = IERC20(args.usdtToken);
        aToken[args.usdtToken] = args.aUsdtToken;
    }

    function supplyAave(uint256 amount, address token) public {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        IPool pool = IPool(aavePoolProvider.getPool());

        IERC20(token).approve(address(pool), amount);
        pool.supply(token, amount, address(this), 0);

        userAaveBalances[msg.sender][token] += amount;
    }

    function withdrawAave(uint256 amount, address token) public {
        IPool pool = IPool(aavePoolProvider.getPool());

        IERC20(aToken[token]).approve(address(pool), amount);
        pool.withdraw(token, amount, address(this));

        IERC20(token).transfer(msg.sender, amount);

        userAaveBalances[msg.sender][token] -= amount;
    }

    function depositUniswap(uint256 amount1, uint256 amount2, address token1, address token2, uint24 fee) public returns (uint256 tokenId) {
        IERC20(token1).transferFrom(msg.sender, address(this), amount1);
        IERC20(token2).transferFrom(msg.sender, address(this), amount2);

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

        (tokenId,,,) = npmUniswap.mint(params);
        tokenIdToPool[tokenId] = IUniswapV3Factory(npmUniswap.factory()).getPool(token1, token2, fee);

        tokenIdToUser[tokenId] = msg.sender;
        userTokenIds[msg.sender].push(tokenId);


        IERC20(token1).transfer(msg.sender, IERC20(token1).balanceOf(address(this)));
        IERC20(token2).transfer(msg.sender, IERC20(token2).balanceOf(address(this)));
    }


    function withdrawUniswap(uint256 tokenId) public {
        require(tokenIdToUser[tokenId] == msg.sender, "You are not the owner of this token");

        uint128 liquidity = getLiquidity(tokenId);

        (uint256 amount0, uint256 amount1) = getAmounts(tokenId);
        
        INonfungiblePositionManager.DecreaseLiquidityParams memory params = INonfungiblePositionManager.DecreaseLiquidityParams({
            tokenId : tokenId,
            liquidity : liquidity,
            amount0Min : 0,
            amount1Min : 0,
            deadline : block.timestamp
        });

        npmUniswap.decreaseLiquidity(params);

        INonfungiblePositionManager.CollectParams memory collectParams = INonfungiblePositionManager.CollectParams({
            tokenId: tokenId,
            recipient: address(this),
            amount0Max: type(uint128).max,
            amount1Max: type(uint128).max
        });
        npmUniswap.collect(collectParams);

        address pool = tokenIdToPool[tokenId];
        IERC20(IUniswapV3Pool(pool).token0()).transfer(msg.sender, amount0);
        IERC20(IUniswapV3Pool(pool).token1()).transfer(msg.sender, amount1);
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
                (baseBalance, sideBalance) = (balance0, balance1);
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

    function balance(address user) public view returns (Balances memory) {
        return Balances({
            aaveWeth: userAaveBalances[user][address(weth)],
            aaveUsdc: userAaveBalances[user][address(usdc)],
            aaveWbtc: userAaveBalances[user][address(wbtc)],
            aaveUsdt: userAaveBalances[user][address(usdt)],
            tokenIds: userTokenIds[user]
        });
    }   


    function onERC721Received(address, address, uint256, bytes memory) external override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}