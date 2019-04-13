var Moodle = require("./moodle.js");

module.exports = async (args) => {

    let plugin_path=args._[2];
    let moodle = new Moodle();
    await moodle.install_plugin(plugin_path);
    await moodle.upgrade();
}