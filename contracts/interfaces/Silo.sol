// SPDX-License-Identifier: AGPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

interface IBaseSilo {
    enum AssetStatus { Undefined, Active, Removed }

    /// @dev Storage struct that holds data related to fees and interest
    struct AssetInterestData {
        /// @dev Total amount of already harvested protocol fees
        uint256 harvestedProtocolFees;
        /// @dev Total amount (ever growing) of asset token that has been earned by the protocol from
        /// generated interest.
        uint256 protocolFees;
        /// @dev Timestamp of the last time `interestRate` has been updated in storage.
        uint64 interestRateTimestamp;
        /// @dev True if asset was removed from the protocol. If so, deposit and borrow functions are disabled
        /// for that asset
        AssetStatus status;
    }

    /// @notice data that InterestModel needs for calculations
    struct UtilizationData {
        uint256 totalDeposits;
        uint256 totalBorrowAmount;
        /// @dev timestamp of last interest accrual
        uint64 interestRateTimestamp;
    }

    /// @dev Shares names and symbols that are generated while asset initialization
    struct AssetSharesMetadata {
        /// @dev Name for the collateral shares token
        string collateralName;
        /// @dev Symbol for the collateral shares token
        string collateralSymbol;
        /// @dev Name for the collateral only (protected collateral) shares token
        string protectedName;
        /// @dev Symbol for the collateral only (protected collateral) shares token
        string protectedSymbol;
        /// @dev Name for the debt shares token
        string debtName;
        /// @dev Symbol for the debt shares token
        string debtSymbol;
    }

    /// @return version of the silo contract
    function VERSION() external returns (uint128); // solhint-disable-line func-name-mixedcase

    /// @notice Synchronize current bridge assets with Silo
    /// @dev This function needs to be called on Silo deployment to setup all assets for Silo. It needs to be
    /// called every time a bridged asset is added or removed. When bridge asset is removed, depositing and borrowing
    /// should be disabled during asset sync.
    function syncBridgeAssets() external;


    /// @notice Get asset interest data
    /// @param _asset asset address
    /// @return AssetInterestData struct
    function interestData(address _asset) external view returns (AssetInterestData memory);

    /// @dev helper method for InterestRateModel calculations
    function utilizationData(address _asset) external view returns (UtilizationData memory data);

    /// @notice Calculates solvency of an account
    /// @param _user wallet address for which solvency is calculated
    /// @return true if solvent, false otherwise
    function isSolvent(address _user) external view returns (bool);

    /// @notice Returns all initialized (synced) assets of Silo including current and removed bridge assets
    /// @return assets array of initialized assets of Silo
    function getAssets() external view returns (address[] memory assets);


    /// @notice Check if depositing an asset for given account is possible
    /// @dev Depositing an asset that has been already borrowed (and vice versa) is disallowed
    /// @param _asset asset we want to deposit
    /// @param _depositor depositor address
    /// @return true if asset can be deposited by depositor
    function depositPossible(address _asset, address _depositor) external view returns (bool);

    /// @notice Check if borrowing an asset for given account is possible
    /// @dev Borrowing an asset that has been already deposited (and vice versa) is disallowed
    /// @param _asset asset we want to deposit
    /// @param _borrower borrower address
    /// @return true if asset can be borrowed by borrower
    function borrowPossible(address _asset, address _borrower) external view returns (bool);

    /// @dev Amount of token that is available for borrowing
    /// @param _asset asset to get liquidity for
    /// @return Silo liquidity
    function liquidity(address _asset) external view returns (uint256);
}

interface ISilo is IBaseSilo {

    /// @notice Deposit `_amount` of `_asset` tokens from `msg.sender` to the Silo
    /// @param _asset The address of the token to deposit
    /// @param _amount The amount of the token to deposit
    /// @param _collateralOnly True if depositing collateral only
    /// @return collateralAmount deposited amount
    /// @return collateralShare user collateral shares based on deposited amount
    function deposit(address _asset, uint256 _amount, bool _collateralOnly)
    external
    returns (uint256 collateralAmount, uint256 collateralShare);

    /// @notice Router function to deposit `_amount` of `_asset` tokens to the Silo for the `_depositor`
    /// @param _asset The address of the token to deposit
    /// @param _depositor The address of the recipient of collateral tokens
    /// @param _amount The amount of the token to deposit
    /// @param _collateralOnly True if depositing collateral only
    /// @return collateralAmount deposited amount
    /// @return collateralShare `_depositor` collateral shares based on deposited amount
    function depositFor(address _asset, address _depositor, uint256 _amount, bool _collateralOnly)
    external
    returns (uint256 collateralAmount, uint256 collateralShare);

    /// @notice Withdraw `_amount` of `_asset` tokens from the Silo to `msg.sender`
    /// @param _asset The address of the token to withdraw
    /// @param _amount The amount of the token to withdraw
    /// @param _collateralOnly True if withdrawing collateral only deposit
    /// @return withdrawnAmount withdrawn amount that was transferred to user
    /// @return withdrawnShare burned share based on `withdrawnAmount`
    function withdraw(address _asset, uint256 _amount, bool _collateralOnly)
    external
    returns (uint256 withdrawnAmount, uint256 withdrawnShare);

    /// @notice Router function to withdraw `_amount` of `_asset` tokens from the Silo for the `_depositor`
    /// @param _asset The address of the token to withdraw
    /// @param _depositor The address that originally deposited the collateral tokens being withdrawn,
    /// it should be the one initiating the withdrawal through the router
    /// @param _receiver The address that will receive the withdrawn tokens
    /// @param _amount The amount of the token to withdraw
    /// @param _collateralOnly True if withdrawing collateral only deposit
    /// @return withdrawnAmount withdrawn amount that was transferred to `_receiver`
    /// @return withdrawnShare burned share based on `withdrawnAmount`
    function withdrawFor(
        address _asset,
        address _depositor,
        address _receiver,
        uint256 _amount,
        bool _collateralOnly
    ) external returns (uint256 withdrawnAmount, uint256 withdrawnShare);

    /// @notice Borrow `_amount` of `_asset` tokens from the Silo to `msg.sender`
    /// @param _asset The address of the token to borrow
    /// @param _amount The amount of the token to borrow
    /// @return debtAmount borrowed amount
    /// @return debtShare user debt share based on borrowed amount
    function borrow(address _asset, uint256 _amount) external returns (uint256 debtAmount, uint256 debtShare);

    /// @notice Router function to borrow `_amount` of `_asset` tokens from the Silo for the `_receiver`
    /// @param _asset The address of the token to borrow
    /// @param _borrower The address that will take the loan,
    /// it should be the one initiating the borrowing through the router
    /// @param _receiver The address of the asset receiver
    /// @param _amount The amount of the token to borrow
    /// @return debtAmount borrowed amount
    /// @return debtShare `_receiver` debt share based on borrowed amount
    function borrowFor(address _asset, address _borrower, address _receiver, uint256 _amount)
    external
    returns (uint256 debtAmount, uint256 debtShare);

    /// @notice Repay `_amount` of `_asset` tokens from `msg.sender` to the Silo
    /// @param _asset The address of the token to repay
    /// @param _amount amount of asset to repay, includes interests
    /// @return repaidAmount amount repaid
    /// @return burnedShare burned debt share
    function repay(address _asset, uint256 _amount) external returns (uint256 repaidAmount, uint256 burnedShare);

    /// @notice Allows to repay in behalf of borrower to execute liquidation
    /// @param _asset The address of the token to repay
    /// @param _borrower The address of the user to have debt tokens burned
    /// @param _amount amount of asset to repay, includes interests
    /// @return repaidAmount amount repaid
    /// @return burnedShare burned debt share
    function repayFor(address _asset, address _borrower, uint256 _amount)
    external
    returns (uint256 repaidAmount, uint256 burnedShare);

    /// @dev harvest protocol fees from an array of assets
    /// @return harvestedAmounts amount harvested during tx execution for each of silo asset
    function harvestProtocolFees() external returns (uint256[] memory harvestedAmounts);

    /// @notice Function to update interests for `_asset` token since the last saved state
    /// @param _asset The address of the token to be updated
    /// @return interest accrued interest
    function accrueInterest(address _asset) external returns (uint256 interest);

    /// @notice this methods does not requires to have tokens in order to liquidate user
    /// @dev during liquidation process, msg.sender will be notified once all collateral will be send to him
    /// msg.sender needs to be `IFlashLiquidationReceiver`
    /// @param _users array of users to liquidate
    /// @param _flashReceiverData this data will be forward to msg.sender on notification
    /// @return assets array of all processed assets (collateral + debt, including removed)
    /// @return receivedCollaterals receivedCollaterals[userId][assetId] => amount
    /// amounts of collaterals send to `_flashReceiver`
    /// @return shareAmountsToRepaid shareAmountsToRepaid[userId][assetId] => amount
    /// required amounts of debt to be repaid
    function flashLiquidate(address[] memory _users, bytes memory _flashReceiverData)
    external
    returns (
        address[] memory assets,
        uint256[][] memory receivedCollaterals,
        uint256[][] memory shareAmountsToRepaid
    );
}

/// @title SiloLens
/// @notice Utility contract that simplifies reading data from Silo protocol contracts
/// @custom:security-contact security@silo.finance
interface ISiloLens {
    /// @notice Calculates current deposit (with interest) for user
    /// Collateral only deposits are not counted here. To get collateral only deposit call:
    /// `_silo.assetStorage(_asset).collateralOnlyDeposits`
    /// @dev Interest is calculated based on the provided timestamp with is expected to be current time.
    /// @param _silo Silo address from which to read data
    /// @param _asset token address for which calculation are done
    /// @param _user account for which calculation are done
    /// @param _timestamp timestamp used for interest calculations
    /// @return totalUserDeposits amount of asset user posses
    function getDepositAmount(ISilo _silo, address _asset, address _user, uint256 _timestamp)
        external
        view
        returns (uint256 totalUserDeposits);

    /// @dev Amount of token that is available for borrowing.
    /// @param _silo Silo address from which to read data
    /// @param _asset asset address for which to read data
    /// @return Silo liquidity
    function liquidity(ISilo _silo, address _asset) external view returns (uint256);

    /// @notice Get amount of asset token that has been deposited to Silo
    /// @dev It reads directly from storage so interest generated between last update and now is not taken for account
    /// @param _silo Silo address from which to read data
    /// @param _asset asset address for which to read data
    /// @return amount of all deposits made for given asset
    function totalDeposits(ISilo _silo, address _asset) external view returns (uint256);

    /// @notice Get amount of asset token that has been deposited to Silo with option "collateralOnly"
    /// @dev It reads directly from storage so interest generated between last update and now is not taken for account
    /// @param _silo Silo address from which to read data
    /// @param _asset asset address for which to read data
    /// @return amount of all "collateralOnly" deposits made for given asset
    function collateralOnlyDeposits(ISilo _silo, address _asset) external view returns (uint256);

    /// @notice Get amount of asset that has been borrowed
    /// @dev It reads directly from storage so interest generated between last update and now is not taken for account
    /// @param _silo Silo address from which to read data
    /// @param _asset asset address for which to read data
    /// @return amount of asset that has been borrowed
    function totalBorrowAmount(ISilo _silo, address _asset) external view returns (uint256);

    /// @notice Get amount of fees earned by protocol to date
    /// @dev It reads directly from storage so interest generated between last update and now is not taken for account
    /// @param _silo Silo address from which to read data
    /// @param _asset asset address for which to read data
    /// @return amount of fees earned by protocol to date
    function protocolFees(ISilo _silo, address _asset) external view returns (uint256);

    /// @notice Returns Loan-To-Value for an account
    /// @dev Each Silo has multiple asset markets (bridge assets + unique asset). This function calculates
    /// a sum of all deposits and all borrows denominated in quote token. Returns fraction between borrow value
    /// and deposit value with 18 decimals.
    /// @param _silo Silo address from which to read data
    /// @param _user wallet address for which LTV is calculated
    /// @return userLTV user current LTV with 18 decimals
    function getUserLTV(ISilo _silo, address _user) external view returns (uint256 userLTV);

    /// @notice Get totalSupply of debt token
    /// @dev Debt token represents a share in total debt of given asset
    /// @param _silo Silo address from which to read data
    /// @param _asset asset address for which to read data
    /// @return totalSupply of debt token
    function totalBorrowShare(ISilo _silo, address _asset) external view returns (uint256);

    /// @notice Calculates current borrow amount for user with interest
    /// @dev Interest is calculated based on the provided timestamp with is expected to be current time.
    /// @param _silo Silo address from which to read data
    /// @param _asset token address for which calculation are done
    /// @param _user account for which calculation are done
    /// @param _timestamp timestamp used for interest calculations
    /// @return total amount of asset user needs to repay at provided timestamp
    function getBorrowAmount(ISilo _silo, address _asset, address _user, uint256 _timestamp)
    external
    view
    returns (uint256);

    /// @notice Get debt token balance of a user
    /// @dev Debt token represents a share in total debt of given asset. This method calls balanceOf(_user)
    /// on that token.
    /// @param _silo Silo address from which to read data
    /// @param _asset asset address for which to read data
    /// @param _user wallet address for which to read data
    /// @return balance of debt token of given user
    function borrowShare(ISilo _silo, address _asset, address _user) external view returns (uint256);

    /// @notice Get underlying balance of all deposits of given token of given user including "collateralOnly"
    /// deposits
    /// @dev It reads directly from storage so interest generated between last update and now is not taken for account
    /// @param _silo Silo address from which to read data
    /// @param _asset asset address for which to read data
    /// @param _user wallet address for which to read data
    /// @return balance of underlying tokens for the given user
    function collateralBalanceOfUnderlying(ISilo _silo, address _asset, address _user) external view returns (uint256);

    /// @notice Get amount of debt of underlying token for given user
    /// @dev It reads directly from storage so interest generated between last update and now is not taken for account
    /// @param _silo Silo address from which to read data
    /// @param _asset asset address for which to read data
    /// @param _user wallet address for which to read data
    /// @return balance of underlying token owed
    function debtBalanceOfUnderlying(ISilo _silo, address _asset, address _user) external view returns (uint256);

    /// @notice Calculate value of collateral asset for user
    /// @dev It dynamically adds interest earned. Takes for account collateral only deposits as well.
    /// @param _silo Silo address from which to read data
    /// @param _user account for which calculation are done
    /// @param _asset token address for which calculation are done
    /// @return value of collateral denominated in quote token with 18 decimal
    function calculateCollateralValue(ISilo _silo, address _user, address _asset)
    external
    view
    returns (uint256);

    /// @notice Calculate value of borrowed asset by user
    /// @dev It dynamically adds interest earned to borrowed amount
    /// @param _silo Silo address from which to read data
    /// @param _user account for which calculation are done
    /// @param _asset token address for which calculation are done
    /// @return value of debt denominated in quote token with 18 decimal
    function calculateBorrowValue(ISilo _silo, address _user, address _asset)
    external
    view
    returns (uint256);

    /// @notice Get combined liquidation threshold for a user
    /// @dev Methodology for calculating liquidation threshold is as follows. Each Silo is combined form multiple
    /// assets (bridge assets + unique asset). Each of these assets may have different liquidation threshold.
    /// That means effective liquidation threshold must be calculated per asset based on current deposits and
    /// borrows of given account.
    /// @param _silo Silo address from which to read data
    /// @param _user wallet address for which to read data
    /// @return liquidationThreshold liquidation threshold of given user
    function getUserLiquidationThreshold(ISilo _silo, address _user)
    external
    view
    returns (uint256 liquidationThreshold);

    /// @notice Get combined maximum Loan-To-Value for a user
    /// @dev Methodology for calculating maximum LTV is as follows. Each Silo is combined form multiple assets
    /// (bridge assets + unique asset). Each of these assets may have different maximum Loan-To-Value for
    /// opening borrow position. That means effective maximum LTV must be calculated per asset based on
    /// current deposits and borrows of given account.
    /// @param _silo Silo address from which to read data
    /// @param _user wallet address for which to read data
    /// @return maximumLTV Maximum Loan-To-Value of given user
    function getUserMaximumLTV(ISilo _silo, address _user) external view returns (uint256 maximumLTV);

    /// @notice Check if user is in debt
    /// @param _silo Silo address from which to read data
    /// @param _user wallet address for which to read data
    /// @return TRUE if user borrowed any amount of any asset, otherwise FALSE
    function inDebt(ISilo _silo, address _user) external view returns (bool);

    /// @notice Check if user has position (debt or borrow) in any asset
    /// @param _silo Silo address from which to read data
    /// @param _user wallet address for which to read data
    /// @return TRUE if user has position (debt or borrow) in any asset
    function hasPosition(ISilo _silo, address _user) external view returns (bool);

    /// @notice Calculates fraction between borrowed amount and the current liquidity of tokens for given asset
    /// denominated in percentage
    /// @dev Utilization is calculated current values in storage so it does not take for account earned
    /// interest and ever-increasing total borrow amount. It assumes `Model.DP()` = 100%.
    /// @param _silo Silo address from which to read data
    /// @param _asset asset address
    /// @return utilization value
    function getUtilization(ISilo _silo, address _asset) external view returns (uint256);

    /// @notice Yearly interest rate for depositing asset token, dynamically calculated for current block timestamp
    /// @param _silo Silo address from which to read data
    /// @param _asset asset address
    /// @return APY with 18 decimals
    function depositAPY(ISilo _silo, address _asset) external view returns (uint256);

    /// @notice Calculate amount of entry fee for given amount
    /// @param _amount amount for which to calculate fee
    /// @return Amount of token fee to be paid
    function calcFee(uint256 _amount) external view returns (uint256);

    /// @dev Method for sanity check
    /// @return always true
    function lensPing() external pure returns (bytes4);

    /// @notice Yearly interest rate for borrowing asset token, dynamically calculated for current block timestamp
    /// @param _silo Silo address from which to read data
    /// @param _asset asset address
    /// @return APY with 18 decimals
    function borrowAPY(ISilo _silo, address _asset) external view returns (uint256);

    /// @notice returns total deposits with interest dynamically calculated at current block timestamp
    /// @param _asset asset address
    /// @return _totalDeposits total deposits amount with interest
    function totalDepositsWithInterest(ISilo _silo, address _asset) external view returns (uint256 _totalDeposits);

    /// @notice returns total borrow amount with interest dynamically calculated at current block timestamp
    /// @param _asset asset address
    /// @return _totalBorrowAmount total deposits amount with interest
    function totalBorrowAmountWithInterest(ISilo _silo, address _asset)
    external
    view
    returns (uint256 _totalBorrowAmount);

    /// @notice Get underlying balance of collateral or debt token
    /// @dev You can think about debt and collateral tokens as cToken in compound. They represent ownership of
    /// debt or collateral in given Silo. This method converts that ownership to exact amount of underlying token.
    /// @param _assetTotalDeposits Total amount of assets that has been deposited or borrowed. For collateral token,
    /// use `totalDeposits` to get this value. For debt token, use `totalBorrowAmount` to get this value.
    /// @param _shareToken share token address. It's the collateral and debt share token address. You can find
    /// these addresses in:
    /// - `ISilo.AssetStorage.collateralToken`
    /// - `ISilo.AssetStorage.collateralOnlyToken`
    /// - `ISilo.AssetStorage.debtToken`
    /// @param _user wallet address for which to read data
    /// @return balance of underlying token deposited or borrowed of given user
    function balanceOfUnderlying(uint256 _assetTotalDeposits, IShareToken _shareToken, address _user)
    external
    view
    returns (uint256);

}

interface IShareToken is IERC20Metadata {

    /// @notice Mint method for Silo to create debt position
    /// @param _account wallet for which to mint token
    /// @param _amount amount of token to be minted
    function mint(address _account, uint256 _amount) external;

    /// @notice Burn method for Silo to close debt position
    /// @param _account wallet for which to burn token
    /// @param _amount amount of token to be burned
    function burn(address _account, uint256 _amount) external;
}

/// @title Tower
/// @notice Utility contract that stores addresses of any contracts
interface ISiloTower {

    /// @param _key string key
    /// @return address coordinates for the `_key`
    function coordinates(string calldata _key) external view returns (address);

    /// @param _key raw bytes32 key
    /// @return address coordinates for the raw `_key`
    function rawCoordinates(bytes32 _key) external view returns (address);

    /// @dev generating mapping key based on string
    /// @param _key string key
    /// @return bytes32 representation of the `_key`
    function makeKey(string calldata _key) external pure returns (bytes32);
}

