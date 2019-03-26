var Moodle = require("./moodle.js");

module.exports = async (args) => {
    const name = args.name
    moodle = new Moodle();
    //await moodle.download();
    //await moodle.create_moodledata();
    await moodle.install_plugins();
    await moodle.upgrade();
}