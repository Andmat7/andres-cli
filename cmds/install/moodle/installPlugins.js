var Moodle = require("./moodle.js");

module.exports = async (args) => {
    moodle = new Moodle();
    await moodle.install_plugins();
}