const exec = require('await-exec')
module.exports =
    class Moodle {
        constructor() {
            this.config = require(process.cwd() + '/install-config.json');
        }
        async download() {
            let moodle_version = this.config['moodle-version']
            let clone = await exec(`git clone --single-branch --depth=1 -b MOODLE_${moodle_version}_STABLE git://git.moodle.org/moodle.git moodle`);
            console.log(clone);
            console.log(clone.stdout);
        }
        async create_moodledata() {
            await exec(`mkdir moodledata`);
            await exec(`chmod -R +a "_www allow read,delete,write,append,file_inherit,directory_inherit" moodledata`);
        }
        async install() {
            let mysql = this.config.mysql;
            let moodle = this.config.moodle;
            let env = this.config.env;
            let dataroot = process.cwd() + '/moodledata';
            let install = await exec(`${env.php_path} moodle/admin/cli/install.php --non-interactive  --agree-license --dbuser=${mysql.dbuser} --dbpass=${mysql.dbpass} --dbname=${mysql.dbname} --dbtype=mariadb --adminpass=${moodle.adminpass} --wwwroot=${moodle.url}  --fullname=${moodle.fullname} --shortname=moodle --adminemail=${moodle.adminemail} --adminuser=${moodle.adminuser} --dataroot=${dataroot}`);
            console.log(install)
        }
        async clone_plugin(plugin) {
            let moodle = this.config.moodle;
            try {
                let branch = ''
                if (plugin.branch) {
                    branch = '-b ' + plugin.branch
                }
                let clone = await exec(`git clone ${branch} ${plugin.repo} ${moodle.path_installation}/${plugin.path}`);
                console.log(clone)
            }
            catch (e) {
                console.log(e)
            }
            if (plugin.exec) {
                let install = await exec(`cd ${moodle.path_installation} && ` + plugin.exec);
                console.log(install)                
            }
        }
        async install_plugins() {
            let plugins = this.config.plugins;
            plugins.forEach(async plugin => {
                await this.clone_plugin(plugin)
            });
            this.upgrade();

        }
        async upgrade() {
            let env = this.config.env;
            let moodle = this.config.moodle;
            try {
                let upgrade = await exec(`${env.php_path} ${moodle.path_installation}/admin/cli/upgrade.php --non-interactive`);
                console.log(upgrade);
            } catch (e) {
                console.log(e);
            }
        }
    }