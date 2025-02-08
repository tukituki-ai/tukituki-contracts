const {deployProxy} = require("./util");

module.exports = async ({deployments}) => {
    const {save} = deployments;
    await deployProxy('Agent', deployments, save);
};

module.exports.tags = ['Agent'];