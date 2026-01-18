import fs from "fs/promises";
import path from "path";
import { CustomError, CustomErrorCode } from "../../errors";
import { Course } from "../../types";

export async function getConfig() {
    const filePath = path.join(process.cwd(), "config.json");
    const data = await fs.readFile(filePath);

    const courses = JSON.parse(data.toString()).courses as Course[];

    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];

        if (!course.code) {
            throw new CustomError(
                CustomErrorCode.INVALID_CONFIG_DATA,
                `ATTN: class "${course.classId}" at index ${i} doesn't have the "code" property assigned`,
            );
        } else if (!course.curriculum) {
            throw new CustomError(
                CustomErrorCode.INVALID_CONFIG_DATA,
                `ATTN: class "${course.code}" at index ${i} doesn't have the "curriculum" property assigned`,
            );
        } else if (!course.classId) {
            throw new CustomError(
                CustomErrorCode.INVALID_CONFIG_DATA,
                `ATTN: class "${course.code}" at index ${i} doesn't have the "classId" property assigned`,
            );
        } else if (!course.credit) {
            throw new CustomError(
                CustomErrorCode.INVALID_CONFIG_DATA,
                `ATTN: class "${course.code}" at index ${i} doesn't have the "classId" property assigned`,
            );
        }
    }

    return courses;
}
