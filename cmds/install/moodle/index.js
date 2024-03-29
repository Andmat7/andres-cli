var Moodle = require("./moodle.js");

module.exports = async (args) => {
    moodle = new Moodle();
    await moodle.download();
    await moodle.create_moodledata();
    await moodle.install()
    await moodle.upgrade();
    await moodle.install_plugins();
}