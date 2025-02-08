// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IPoolAddressesProvider, IPool} from "./interfaces/Aave.sol";
import {ICompound} from "./interfaces/Compound.sol";


contract Agent is AccessControlUpgradeable, UUPSUpgradeable {
    IPoolAddressesProvider public aavePoolProvider;
    ICompound public compound;

    IERC20 public usdc;
    IERC20 public aUsdc;
    IERC20 public weth;
    IERC20 public aWeth;

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

        address usdcToken;
        address aUsdcToken;
        address wethToken;
        address aWethToken;
    }

    function setArgs(Args memory args) public {
        aavePoolProvider = IPoolAddressesProvider(args.aavePoolProvider);
        compound = ICompound(args.compound);
        usdc = IERC20(args.usdcToken);
        aUsdc = IERC20(args.aUsdcToken);
        weth = IERC20(args.wethToken);
        aWeth = IERC20(args.aWethToken);
    }

    function supplyAave(uint256 amount, address token) public {
        IPool pool = IPool(aavePoolProvider.getPool());

        IERC20(token).approve(address(pool), amount);
        pool.supply(token, amount, address(this), 0);
    }

    // expected aToken
    function withdrawAave(uint256 amount, address token) public {
        IPool pool = IPool(aavePoolProvider.getPool());

        IERC20(token).approve(address(pool), amount );
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
}
