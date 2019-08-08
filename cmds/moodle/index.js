module.exports = async (args) => {
    const name = args.name
    let cmd = args._[1]
    var Moodle = require("./moodle.js");
    let moodle
    switch (cmd) {
        case 'upload_hvp':
            moodle = new Moodle(args);
            await moodle.upload_hvp(args);
            break
        case 'clear_hvp':
            moodle = new Moodle(args);
            await moodle.clear_hvp();
            break
        case 'add_course':
            moodle = new Moodle(args);
            await moodle.add_course(args);
            break
        case 'add_course_with_hvps':
            moodle = new Moodle(args);
                await moodle.add_course_with_hvps(args);
                break
        case 'delete_course':
            moodle = new Moodle(args);  
            await moodle.delete_course(args);
            break
        case 'section':
            require('./MoodleManager').section(args)
            break
        default:
            console.log(`"${cmd}" is not a valid install command!`, true)
            break
    }
}