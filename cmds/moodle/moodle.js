const fs = require("fs");
module.exports =
    class Moodle {
        constructor(args) {
            this.config = require(process.cwd() + '/install-config.json');
            this.puppeteer = require('puppeteer');
            if (args.moodle_url) {
                this.moodle_url = args.moodle_url
            } else {
                this.moodle_url = this.config.moodle.url
            }
            if (args.moodle_user) {
                this.moodle_user = args.moodle_user
            } else {
                this.moodle_user = this.config.moodle.adminuser

            }
            this.moodle_password = this.config.moodle.adminpass
            this.devtools = false;
            if (args.devtools) {
                this.devtools = args.devtools
            }

        }
        async _init() {
            this.browser = await this.puppeteer.launch({ devtools: this.devtools });
            this.courses_path = process.cwd() + '/courses-lock.json'
            if (fs.existsSync(this.courses_path)) {
                this.courses = require(this.courses_path);
            } else {
                this.courses = {}
            }
            this.page = await this.browser.newPage();
        }
        async _end() {
            fs.writeFileSync(this.courses_path, JSON.stringify(this.courses, null, 4));
            this.browser.close();
            console.log("finish")
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
            await this.page.type('#username', this.moodle_user)
            await this.page.type('#password', this.moodle_password)
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
            await this._end()
            console.log('finish')
        }

        async _add_hvps(course, Lesson_level, Lesson_name, fromSCORM) {
            if (!("sections" in course)) {
                let sections = []
                if (course.fromSCORM) {
                    sections = require('./templates/course-sections-scorm.json');
                }
                course.sections = sections;
            }
            for (let section_id = 0; section_id < course.sections.length; section_id++) {
                const section = course.sections[section_id];
                for (let j = 0; j < section.activities.length; j++) {
                    const activity = section.activities[j];
                    if (!activity.id) {
                        activity.id = await this._upload_hvp_with_type(activity.type_h5p, course.id, section_id, Lesson_level, Lesson_name);
                    }
                    section.activities[j] = activity
                }
                course.sections[section_id] = section

            }

            return course;
        }
        async _upload_hvp_with_type(type, course_id, section_id, Lesson_level, Lesson_name) {
            let h5p_name = Lesson_level + 'Lesson' + Lesson_name + type + type + '.h5p'
            await this._upload_hvp(course_id, section_id, 'UP/English/General/' + Lesson_level + '/Lesson' + Lesson_name + '/' + type + '/' + h5p_name)
        }
        async add_course_with_hvps(args) {
            await this._init()
            await this.login()
            let category_id = args.category_id
            let course_name = args.course_name
            let course_short_name = args.course_short_name
            let course_id;
            if (!(course_short_name in this.courses)) {
                course_id = await this._add_course(category_id, course_name, course_short_name)
                this.courses[course_short_name] = {
                    "id": course_id,
                    "short_name": course_short_name,
                    "name": course_name,
                    "fromSCORM": true,
                };
            } else {
                course_id = this.courses[course_short_name].id;
            }
            this.courses[course_short_name] = await this._add_hvps(this.courses[course_short_name], "A1", 1, true)
            await this._end()
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
                await frame.waitForSelector('body > div > div.h5peditor-form', {
                    timeout: 100000
                })
                await Promise.all([
                    page.evaluate(
                        () => {
                            document.querySelector("#id_submitbutton").click()
                        }
                    ),
                    page.waitForNavigation(),
                ]);
                let activity_string = await page.evaluate(
                    () => {
                        return document.querySelector("#section-0 .content ul.section>li:nth-last-child(2)").id
                    }
                )
                let activity_id = activity_string.split('-')[1]
                console.log('uploaded h5p with id' + activity_id)
                return activity_id;
            } catch (error) {
                console.log(error.stack)
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
