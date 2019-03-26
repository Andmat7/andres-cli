module.exports = (args) => {
    const name = args.name
    let cmd = args._[1]
    switch (cmd) {
        case 'moodle':
            require('./moodle')(args)
            break
        default:
            error(`"${cmd}" is not a valid install command!`, true)
            break
    }
}