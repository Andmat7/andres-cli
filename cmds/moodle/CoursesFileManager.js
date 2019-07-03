const fs = require("fs")
class CoursesFileManager {
    constructor(path) {
        this.path = path
    }
    update(courses) {
        fs.writeFileSync(this.path, JSON.stringify(courses, null, 4));
    }
}
module.exports = new CoursesFileManager(process.cwd() + '/courses-lock.json')