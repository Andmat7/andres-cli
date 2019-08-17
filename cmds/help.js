const menus = {
    main: `
      andres-cli [command] <options>
  
      aws ................ show aws options
      version ............ show package version
      moodle  ............ moodle tools
      help ............... show help menu for a command`,
  
      hello: `
      andres-cli hello <options>
  
      --name, -n ..... the name`,
  }
  
  module.exports = (args) => {
    const subCmd = args._[0] === 'help'
      ? args._[1]
      : args._[0]
  
    console.log(menus[subCmd] || menus.main)
  }