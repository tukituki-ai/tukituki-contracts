// SPDX-License-Identifier: AGPL-3.0
pragma solidity >=0.8.0 <0.9.0;


interface ICompound {
    function supply(address token, uint256 amount) external;
    function withdraw(address token, uint256 amount) external;
}