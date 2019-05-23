module.exports = async (args) => {
    const name = args.name
    let cmd = args._[1]
    var Moodle = require("./moodle.js");
    let moodle = new Moodle(args);
    switch (cmd) {
        case 'upload_hvp':
            await moodle.upload_hvp(args);
            break
        case 'clear_hvp':
            await moodle.clear_hvp();
            break

        default:
            console.log(`"${cmd}" is not a valid install command!`, true)
            break
    }
}