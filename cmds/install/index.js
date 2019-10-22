module.exports = (args) => {
    const name = args.name
    let cmd = args._[1]
    switch (cmd) {
        case 'moodle':
            require('./moodle')(args)
            break
        case 'moodle_plugins':
            require('./moodle/installPlugins')(args)
            break
        case 'moodle_plugin':
            require('./moodle/installPlugin')(args)
        case 'help':
            require('./help.js')(args)
            break
        default:
            console.log(`"${cmd}" is not a valid install command! run
                        andres-cli install help
                        `)
            break
    }
}