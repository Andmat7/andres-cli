class EntityManager {
    constructor(args,configManager){
        this._setArgs(args)
        this.configManager=configManager
    }
    async update(){
        console.log(args)
    }
    _init(){

    }
    _setArgs(args){
        this.args = args
    }
    
}
module.exports = EntityManager