const {deployProxy} = require("./util");

module.exports = async ({deployments}) => {
    const {save} = deployments;
    await deployProxy('Agent', 'Agent', deployments, save);
};

module.exports.tags = ['Agent'];