/**
 * Got from balancer: https://github.com/balancer-labs/balancer-v2-monorepo/blob/master/pvt/common/sharedBeforeEach.ts
 * and adopter to js.
 * License: GPL-3.0
 */

const BigNumber = require('bignumber.js');
const SNAPSHOTS = [];

async function takeSnapshot(provider) {
    return await provider.request({
        method: 'evm_snapshot',
    });
}

async function revert(provider, snapshotId) {
    await provider.request({
        method: 'evm_revert',
        params: [snapshotId],
    });
}

async function getProvider() {
    const hre = require("hardhat");
    return hre.network.provider;
}

/**
 * This Mocha helper acts as a `beforeEach`, but executes the initializer
 * just once. It internally uses Hardhat Network and Ganache's snapshots
 * and revert instead of re-executing the initializer.
 *
 * Note that after the last test is run, the state doesn't get reverted.
 *
 * @param nameOrFn A title that's included in all the hooks that this helper uses.
 * @param maybeFn The initializer to be run before the tests.
 */
function sharedBeforeEach(nameOrFn, maybeFn) {
    const name = typeof nameOrFn === 'string' ? nameOrFn : undefined;
    const fn = typeof nameOrFn === 'function' ? nameOrFn : maybeFn;

    let initialized = false;

    
    beforeEach(wrapWithTitle(name, 'Running shared before each or reverting'), async function () {
        const provider = await getProvider();
        if (!initialized) {
            const prevSnapshot = SNAPSHOTS.pop();
            if (prevSnapshot !== undefined) {
                await revert(provider, prevSnapshot);
                SNAPSHOTS.push(await takeSnapshot(provider));
            }
            await fn.call(this);
            SNAPSHOTS.push(await takeSnapshot(provider));
            initialized = true;
        } else {
            const snapshotId = SNAPSHOTS.pop();
            if (snapshotId === undefined) throw Error('Missing snapshot ID');
            await revert(provider, snapshotId);
            SNAPSHOTS.push(await takeSnapshot(provider));
        }
    });
    after(async function () {
        if (initialized) {
            SNAPSHOTS.pop();
        }
    });
    
}

function wrapWithTitle(title, str) {
    return title === undefined ? str : `${title} at step "${str}"`;
}

function toPrintableObject(obj) {
    if (obj == null) {
      return null;
    }
    if (obj instanceof BigNumber || typeof obj === 'bigint') {
      return obj.toString();
    }
    if (Array.isArray(obj)) {
      return obj.map(toPrintableObject);
    }
    if (typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key,
          toPrintableObject(value),
        ]),
      );
    }
    return obj;
  }




module.exports = {
    sharedBeforeEach,
    toPrintableObject,
}
