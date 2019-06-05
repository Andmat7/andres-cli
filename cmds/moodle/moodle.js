const fs = require("fs");
const chalk = require('chalk');
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
            if (this.courses) {
                fs.writeFileSync(this.courses_path, JSON.stringify(this.courses, null, 4));
            }
            this.browser.close();
            console.log(chalk.yellow("finish"));
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
            console.log('Login to ' + chalk.green(login_url))
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

        async _add_hvps(course, Lesson_level) {

            if (!("sections" in course)) {
                let sections = []
                if (course.fromSCORM) {
                    sections = require('./templates/course-sections-scorm.json');
                }
                course.sections = sections;
            }
            var sections_promises = course.sections.map((section, section_id) => this._add_hvps_on_sections(section, section_id, course.id, Lesson_level))
            course.sections = await Promise.all(sections_promises);
            return course;
        }
        async _add_hvps_on_sections(section, section_id, course_id, Lesson_level) {
            for (let j = 0; j < section.activities.length; j++) {
                const activity = section.activities[j];
                if (!activity.id) {
                    let Lesson_name
                    if (activity.lessonFrom) {
                        Lesson_name = activity.lessonFrom;
                    } else {
                        Lesson_name = section.lessonFrom;

                    }
                    let activity_id = await this._upload_hvp_with_type(activity.type_h5p, course_id, section_id, Lesson_level, Lesson_name);
                    activity.id = activity_id
                }
                section.activities[j] = activity
            }
            return section;
        }
        async _upload_hvp_with_type(type, course_id, section_id, Lesson_level, Lesson_name) {
            let h5p_name = Lesson_level + 'Lesson' + Lesson_name + type + type + '.h5p'
            let activity_id = await this._upload_hvp(course_id, section_id, 'UP/English/General/' + Lesson_level + '/Lesson' + Lesson_name + '/' + type + '/' + h5p_name)
            return activity_id;
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
                if (course_id) {
                    this.courses[course_short_name] = {
                        "id": course_id,
                        "short_name": course_short_name,
                        "name": course_name,
                        "fromSCORM": true,
                    };
                }

            } else {
                course_id = this.courses[course_short_name].id;
            }
            if (course_id) {
                this.courses[course_short_name] = await this._add_hvps(this.courses[course_short_name], "A1")
            }
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
            let url__delete_course = this.moodle_url + "course/delete.php?id=" + course_id
            await this.page.goto(url__delete_course);
            if (this.config.moodle.theme == "snap") {
                await this.page.click("#notice > div > div:nth-child(1) > form > button")
            } else {
                await this.page.click("#modal-footer > div > div:nth-child(1) > form > button")
            }


        }
        async _add_course(category_id, course_name, course_short_name) {
            console.log(chalk.yellow("adding course"))
            let url_add_course = this.moodle_url + "course/edit.php?category=" + category_id
            await this.page.goto(url_add_course);
            await this.page.waitForSelector('#id_fullname')
            await this.page.type('#id_fullname', course_name)
            await this.page.type('#id_shortname', course_short_name)
            await this.page.click("#id_saveanddisplay")
            let url = new URL(this.page.url());
            let course_id = url.searchParams.get("id");
            if (!course_id) {
                new Error("course not created")
                await this.page.setViewport({ "width": 1200, "height": 3000 })
                let picture_path = "./notcreated.jpg"
                await this.page.screenshot({ path: picture_path })
            } else {
                console.log(chalk.green("course created ") + course_id)
                return course_id;
            }

        }

        async upload_hvp(args) {
            await this._init()
            await this.login()
            let course_id = args.course_id
            let section = args.section
            let file = args._[2]
            await this._upload_hvp(course_id, section, file)
            await this.browser.close();
            console.log(chalk.yellow('finish'));
        }

        async _upload_hvp(course_id, section_id, file) {
            let url_upload = this.moodle_url + "course/modedit.php?add=hvp&type=&course=" + course_id + "&section=" + section_id + "&return=0&sr=0"
            console.log(chalk.yellow('uploading :') + file.split('/').pop())
            let page = await this.browser.newPage();
            try {
                if (!fs.existsSync(file)) {
                    console.log(chalk.red(chalk.underline(file) + " not exits"));
                } else {
                    await page.goto(url_upload, { timeout: 120000 })
                    const frames = await page.frames()
                    let frame = frames[1]
                    await frame.waitForSelector("#tab-panel-upload > div > div.upload-form > div > input[type=file]", { timeout: 100000 })
                    const input = await frame.$("#tab-panel-upload > div > div.upload-form > div > input[type=file]");
                    await input.uploadFile(file)
                    await frame.click('#upload')
                    await frame.click('#tab-panel-upload > div > div.upload-form > button')
                    await frame.waitForSelector('body > div > div.h5peditor-form', {
                        timeout: 600000
                    })
                    await Promise.all([
                        page.evaluate(
                            () => {
                                document.querySelector("#id_submitbutton").click()
                            }
                        ),
                        page.waitForNavigation(),
                    ]);
                    let activity_string
                    if (this.config.moodle.theme=="snap") {
                        activity_string = await page.evaluate(
                            (section_id) => {
                                let lies = document.querySelectorAll("#section-" + section_id + " .content ul.section>li.activity")
                                debugger;
                                return lies[lies.length-1].id
                            }, section_id
                        )
                    } else {
                         activity_string = await page.evaluate(
                            (section_id) => {
                                return document.querySelector("#section-" + section_id + " .content ul.section>li:nth-last-child(1)").id
                            }, section_id
                        )
                    }
                    
                    let activity_id = activity_string.split('-')[1]
                    console.log('uploaded h5p with id=' + activity_id)
                    page.close();
                    return activity_id;

                }

            } catch (error) {
                await page.setViewport({ "width": 1200, "height": 3000 })
                let picture_path = Date.now() + ".jpg"
                await page.screenshot({ path: picture_path })
                //console.log(chalk.red('Hello', chalk.underline.bgBlue('world') + '!'))
                console.log(chalk.red(error.message));
                console.log(error.stack);
                page.close();
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
