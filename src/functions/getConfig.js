const fs = require("fs/promises");
const path = require("path");

async function getConfig() {
    const filePath = path.join(process.cwd(), "config.json");
    const data = await fs.readFile(filePath);

    const courses = JSON.parse(data).courses;

    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        if (!course.class && !course.code) {
            throw new Error(
                `ATTN: index ${i} doesn't have the "code" and "class"`
            );
        } else if (!course.code) {
            throw new Error(
                `ATTN: class "${course.class}" at index ${i} doesn't have the "code" property assigned`
            );
        }
    }

    return courses;
}

module.exports = { getConfig };
