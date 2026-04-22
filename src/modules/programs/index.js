const express = require("express");
const { query } = require("../../config/db");
const { successResponse, errorResponse } = require("../../utils/response");

const router = express.Router();

const runOptionalQuery = async (sql, params = []) => {
  try {
    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    // Optional entity tables can be rolled out later via migration.
    if (error.code === "42P01") {
      return [];
    }
    throw error;
  }
};

router.get("/programs", async (req, res) => {
  const { departmentId } = req.query;

  if (!departmentId) {
    return errorResponse(
      res,
      "Validation failed",
      [
        {
          field: "departmentId",
          message: "departmentId query parameter is required",
        },
      ],
      400,
    );
  }

  try {
    const programsResult = await query(
      `
      SELECT
        id,
        department_id,
        code,
        name,
        level,
        duration_years,
        intake_capacity,
        is_active,
        created_at,
        updated_at
      FROM programs
      WHERE department_id = $1
      ORDER BY level ASC, name ASC
      `,
      [departmentId],
    );

    return successResponse(
      res,
      "Programs fetched successfully",
      programsResult.rows.map((program) => ({
        id: program.id,
        departmentId: program.department_id,
        code: program.code,
        name: program.name,
        level: program.level,
        durationYears: program.duration_years,
        intakeCapacity: program.intake_capacity,
        isActive: program.is_active,
        createdAt: program.created_at,
        updatedAt: program.updated_at,
      })),
    );
  } catch (error) {
    if (error.code === "42P01") {
      return successResponse(res, "Programs fetched successfully", []);
    }

    return errorResponse(
      res,
      "Failed to fetch programs",
      [{ field: "programs", message: error.message }],
      500,
    );
  }
});

router.get("/courses", async (req, res) => {
  const { programId } = req.query;

  if (!programId) {
    return errorResponse(
      res,
      "Validation failed",
      [
        {
          field: "programId",
          message: "programId query parameter is required",
        },
      ],
      400,
    );
  }

  try {
    const coursesResult = await query(
      `
      SELECT
        id,
        program_id,
        code,
        name,
        credits,
        semester,
        syllabus_version,
        created_at,
        updated_at
      FROM courses
      WHERE program_id = $1
      ORDER BY semester ASC NULLS LAST, code ASC
      `,
      [programId],
    );

    const courseIds = coursesResult.rows.map((course) => course.id);
    const outcomes = courseIds.length
      ? await runOptionalQuery(
          `
          SELECT id, course_id, outcome_code, outcome_text
          FROM course_outcomes
          WHERE course_id = ANY($1::uuid[])
          ORDER BY outcome_code ASC
          `,
          [courseIds],
        )
      : [];

    const outcomesByCourseId = outcomes.reduce((accumulator, item) => {
      if (!accumulator[item.course_id]) {
        accumulator[item.course_id] = [];
      }
      accumulator[item.course_id].push({
        id: item.id,
        code: item.outcome_code,
        text: item.outcome_text,
      });
      return accumulator;
    }, {});

    return successResponse(
      res,
      "Courses fetched successfully",
      coursesResult.rows.map((course) => ({
        id: course.id,
        programId: course.program_id,
        code: course.code,
        name: course.name,
        credits: Number(course.credits),
        semester: course.semester,
        // Frontend integration note: use syllabus.version for showing
        // the current version on course cards/details.
        syllabus: {
          version: course.syllabus_version,
        },
        outcomes: outcomesByCourseId[course.id] || [],
        createdAt: course.created_at,
        updatedAt: course.updated_at,
      })),
    );
  } catch (error) {
    if (error.code === "42P01") {
      return successResponse(res, "Courses fetched successfully", []);
    }

    return errorResponse(
      res,
      "Failed to fetch courses",
      [{ field: "courses", message: error.message }],
      500,
    );
  }
});

module.exports = router;
