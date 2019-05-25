module.exports =
    class Moodle {
        constructor(args) {
            this.puppeteer = require('puppeteer');
            this.moodle_url = 'http://localhost/moodle34/moodle/'
            this.devtools = false;
            if (args.devtools) {
                this.devtools = args.devtools
            }

        }
        async _init() {
            this.browser = await this.puppeteer.launch({ devtools: this.devtools });
            this.page = await this.browser.newPage();
        }
        async _debugger() {
            await Promise.all([
                this.page.evaluate(
                    () => {
                        debugger;
                    }
                ),
            ]);
        }

        async login() {
            let login_url = this.moodle_url + 'login/index.php'
            console.log('Login to ' + login_url)
            await this.page.goto(login_url);
            await this.page.type('#username', 'moodle34')
            await this.page.type('#password', 'password')
            await Promise.all([
                this.page.click("#loginbtn"),
                this.page.waitForNavigation(),
            ]);
        }
        async clear_hvp() {
            await this._init()
            await this.login()
            this.sesskey = await this.get_sesskey();
            console.log('updating plugins')
            await this.page.goto(this.moodle_url + "/admin/plugins.php?sesskey=" + this.sesskey + "&uninstall=mod_hvp&confirm=1&return=overview");
            await this.page.goto(this.moodle_url + "/admin/index.php?sesskey=" + this.sesskey + "&cache=0&confirmplugincheck=1", { timeout: 120000 });
            await this.browser.close();
            console.log('finish')
        }

        async add_course(args) {
            await this._init()
            await this.login()
            let category_id = args.category_id
            let course_name = args.course_name
            let course_short_name = args.course_short_name
            let course_id = await this._add_course(category_id, course_name, course_short_name)
            console.log("course created " + course_id)
            await this.browser.close();
            console.log('finish')
        }
        async add_course_with_hvps(args) {
            await this._init()
            await this.login()
            let category_id = args.category_id
            let course_name = args.course_name
            let course_short_name = args.course_short_name
            let course_id = await this._add_course(category_id, course_name, course_short_name)
            await Promise.all([
                this._upload_hvp(course_id, 0, 'UP/English/General/A1/Lesson1/LearnAndDiscover/A1Lesson1LearnAndDiscoverLearnAndDiscover.h5p'),
                this._upload_hvp(course_id, 0, 'UP/English/General/A1/Lesson1/ListeningPractice/A1Lesson1ListeningPracticeListeningPractice'),
                this._upload_hvp(course_id, 0, 'UP/English/General/A1/Lesson1/Presentation/A1Lesson1PresentationPresentation.h5p'),
                this._upload_hvp(course_id, 0, 'UP/English/General/A1/Lesson1/ReadAndWrite/A1Lesson1ReadAndWriteReadAndWrite.h5p'),
                this._upload_hvp(course_id, 0, 'UP/English/General/A1/Lesson1/Vocabularies/A1Lesson1ConversationVocabulary.h5p')

            ]);

            this.browser.close();
            console.log('finish')
        }

        async delete_course(args) {
            await this._init()
            await this.login()
            let course_id = args.course_id
            await this._delete_course(course_id)
            console.log("course deleted " + course_id)
            await this.browser.close();
            console.log('finish')
        }
        async _delete_course(course_id) {
            this.sesskey = await this.get_sesskey();
            let url_add_course = this.moodle_url + "course/delete.php?id=" + course_id
            await this.page.goto(url_add_course);
            await this.page.click("#modal-footer > div > div:nth-child(1) > form > button")

        }
        async _add_course(category_id, course_name, course_short_name) {
            let url_add_course = this.moodle_url + "course/edit.php?category=" + category_id
            await this.page.goto(url_add_course);
            await this.page.waitForSelector('#id_fullname')
            await this.page.type('#id_fullname', course_name)
            await this.page.type('#id_shortname', course_short_name)
            await this.page.click("#id_saveanddisplay")
            let url = new URL(this.page.url());
            let course_id = url.searchParams.get("id");
            console.log("course created " + course_id)
            return course_id;
        }

        async upload_hvp(args) {
            await this._init()
            await this.login()
            let course_id = args.course_id
            let section = args.section
            let file = args._[2]
            await this._upload_hvp(course_id, section, file)
            await this.browser.close();
            console.log('finish')
        }
        async _upload_hvp(course_id, section, file) {
            try {

                let url_upload = this.moodle_url + "course/modedit.php?add=hvp&type=&course=" + course_id + "&section=" + section + "&return=0&sr=0"
                console.log('uploading h5p ' + file + ' on ' + url_upload)
                let page = await this.browser.newPage();
                await page.goto(url_upload)
                const frames = await page.frames()
                let frame = frames[1]
                const input = await frame.$("#tab-panel-upload > div > div.upload-form > div > input[type=file]");
                await input.uploadFile(file)
                await frame.click('#upload')
                await frame.click('#tab-panel-upload > div > div.upload-form > button')
                await page.evaluate(
                    () => {
                        debugger
                    }
                )
                await frame.waitForSelector('body > div > div.h5peditor-form')
                await Promise.all([
                    page.evaluate(
                        () => {
                            document.querySelector("#id_submitbutton2").click()
                        }
                    ),
                    page.waitForNavigation(),
                ]);
            } catch (error) {
                console.log(error)
            }

        }
        async get_sesskey() {
            console.log('getting sesskey')
            await this.page.goto(this.moodle_url + 'admin/plugins.php');
            const hrefs = await this.page.evaluate(

                () => Array.from(
                    document.querySelectorAll("#plugins-control-panel > tbody > tr.type-mod.name-mod_book.status-uptodate.enabled.standard > td.uninstall.cell.c4 > a"),
                    a => a.getAttribute('href')
                )
            );
            let url = new URL(hrefs[0]);
            return url.searchParams.get("sesskey");
        }
    }
