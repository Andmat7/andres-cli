var AWS = require("./aws.js");

module.exports = (args) => {
    const name = args.name
    let cmd = args._[1]
    switch (cmd) {
        case 'update_my_ip':
            let aws = new AWS();
            aws.update_ip();
            break

        default:
            console.log(`"${cmd}" is not a AWS valid install command!`, true)
            break
    }
}