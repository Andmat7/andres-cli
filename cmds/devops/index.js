var exec = require('child_process').exec;

module.exports = (args) => {
    const cmd = args._[1]
    console.log(cmd)
    function puts(error, stdout, stderr) { 
        console.log(stdout) 
    }
    exec("packer", puts);
}