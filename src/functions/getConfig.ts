import fs from "fs/promises";
import path from "path";
import { CustomError, CustomErrorCode } from "../errors";
import { Course } from "../types";

export async function getConfig() {
    const filePath = path.join(process.cwd(), "config.json");
    const data = await fs.readFile(filePath);

    const courses = JSON.parse(data.toString()).courses as Course[];

    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];

        if (!course.class && !course.code) {
            throw new CustomError(
                CustomErrorCode.INVALID_CONFIG_DATA,
                `ATTN: index ${i} doesn't have the "code" and "class"`
            );
        } else if (!course.code) {
            throw new CustomError(
                CustomErrorCode.INVALID_CONFIG_DATA,
                `ATTN: class "${course.class}" at index ${i} doesn't have the "code" property assigned`
            );
        }
    }

    return courses;
}
