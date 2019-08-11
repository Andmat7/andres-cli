const exec = require('await-exec')
module.exports =
    class Moodle {
        constructor() {
            this.config = require(process.cwd() + '/install-config.json');
        }
        async exec(command){
            const { exec } = require('promisify-child-process');
            let child = exec(command)
            try {
                child.stdout.on('error', (data) => { 
                    console.log('error prueba' + data) 
                })
    
                child.stderr.on('data', (data) => {
                    process.stderr.write(`\t ${data}`);
                });
                child.stdout.on('data', (data) => {
                    process.stdout.write(`\t ${data}`);
                });
                return await child;
            } catch (error) {
                console.log(error)
            }

        }
        async download() {
            let moodle_version = this.config['moodle-version']
            let clone = await exec(`git clone --single-branch --depth=1 -b MOODLE_${moodle_version}_STABLE git://git.moodle.org/moodle.git moodle`);
            console.log(clone);
            console.log(clone.stdout);
        }
        async create_moodledata() {
            await exec(`mkdir  ${this.config.moodle.dataroot}`);
            await exec(`chmod -R +a "_www allow read,delete,write,append,file_inherit,directory_inherit" ${this.config.moodle.dataroot}`);
        }
        async install() {
            let mysql = this.config.mysql;
            let moodle = this.config.moodle;
            let env = this.config.env;
            let dataroot = process.cwd() + '/moodledata';
            try {
                const { stdout, stderr, code } = await exec(`${env.php_path} moodle/admin/cli/install.php --non-interactive  --agree-license --dbuser=${mysql.dbuser} --dbpass=${mysql.dbpass} --dbname=${mysql.dbname} --dbtype=mariadb --adminpass=${moodle.adminpass} --wwwroot=${moodle.url}  --fullname=${moodle.fullname} --shortname=moodle --adminemail=${moodle.adminemail} --adminuser=${moodle.adminuser} --dataroot=${moodle.dataroot}`);
                console.log(stdout)
                console.log(stderr)
                console.log(code)
            } catch (error) {
                console.log(error)
            }

        }
        async clone_plugin(plugin) {
            let moodle = this.config.moodle;
            let branch = ''
            if (plugin.branch) {
                branch = '-b ' + plugin.branch
            }
            let command = `git clone --progress ${branch} ${plugin.repo}  ${moodle.path_installation}/${plugin.path}`

            await this.exec(command);
            if (plugin.exec) {
                let command = `cd ${moodle.path_installation} && ` + plugin.exec
                await this.exec(command);
            }

        }
        async install_plugin(plugin_path) {

            let plugins = this.config.plugins;
            let exist = false;
            // await plugins.forEach(async plugin => {
            //     if (plugin.path === plugin_path) {
            //         await this.clone_plugin(plugin)
            //         exist = true;
            //     }
            // });
            for await (const plugin of plugins) {
                if (plugin.path === plugin_path) {
                    await this.clone_plugin(plugin)
                    exist = true;
                }
            }
            if (!exist) {
                console.log('el plugin no existe')
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
                await this.exec(`${env.php_path} ${moodle.path_installation}/admin/cli/upgrade.php --non-interactive`);
            } catch (e) {
                console.log(e);
            }
        }
    }