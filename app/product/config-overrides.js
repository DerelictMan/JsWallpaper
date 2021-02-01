const {override, addLessLoader} = require('customize-cra')

module.exports = override(
    //使用less 需要安装 less + lessloader
    //我们重点不是样式，所以大家按需使用
    addLessLoader(),
    (config, env) => {
        //将react与electron关联。
        config.target = "electron-renderer";
        return config;
    }
);
