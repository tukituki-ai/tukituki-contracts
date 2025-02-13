const {deployProxy} = require("./util");

module.exports = async ({deployments}) => {
    const {save} = deployments;
    console.log("deploying agent");
    await deployProxy('Agent', 'Agent', deployments, save);
    console.log("agent deployed");
};

module.exports.tags = ['Agent'];