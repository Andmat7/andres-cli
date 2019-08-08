let SectionManager = require("./managers/SectionManager") 
let ConfigManager = require("./src/configManager") 


module.exports.section = async (args) => {
    let new_args = Object.assign({},args)
    let configManager = new ConfigManager()
    let sectionManager = new SectionManager(new_args,configManager)
    let funct = new_args._[2]
    delete new_args._
    sectionManager[funct](new_args,configManager)
}
