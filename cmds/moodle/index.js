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
        case 'add_course':
            await moodle.add_course(args);
            break
        case 'add_course_hvp':
                await moodle.add_course_hvp(args);
                break
        case 'delete_course':
            await moodle.delete_course(args);
            break
        default:
            console.log(`"${cmd}" is not a valid install command!`, true)
            break
    }
}