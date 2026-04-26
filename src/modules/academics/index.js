const express = require("express");
const { query } = require("../../config/db");
const { successResponse, errorResponse } = require("../../utils/response");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../config/constants");

const router = express.Router();

const mapSchoolRow = (row) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  slug: row.slug,
  overview: row.overview,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  departmentCount: Number(row.department_count || 0),
});

router.get("/schools", async (req, res) => {
  try {
    const schoolsResult = await query(
      `
      SELECT
        s.id,
        s.code,
        s.name,
        s.slug,
        s.overview,
        s.is_active,
        s.created_at,
        s.updated_at,
        COUNT(d.id) AS department_count
      FROM schools s
      LEFT JOIN departments d ON d.school_id = s.id
      GROUP BY s.id
      ORDER BY s.name ASC
      `,
    );

    return successResponse(
      res,
      "Schools fetched successfully",
      schoolsResult.rows.map(mapSchoolRow),
    );
  } catch (error) {
    if (error.code === "42P01") {
      return successResponse(res, "Schools fetched successfully", []);
    }

    return errorResponse(
      res,
      "Failed to fetch schools",
      [{ field: "schools", message: error.message }],
      500,
    );
  }
});

router.get("/schools/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const schoolResult = await query(
      `
      SELECT
        s.id,
        s.code,
        s.name,
        s.slug,
        s.overview,
        s.is_active,
        s.created_at,
        s.updated_at,
        COUNT(d.id) AS department_count
      FROM schools s
      LEFT JOIN departments d ON d.school_id = s.id
      WHERE s.id = $1
      GROUP BY s.id
      `,
      [id],
    );

    if (!schoolResult.rows.length) {
      return errorResponse(
        res,
        "School not found",
        [{ field: "id", message: "No school found for the provided id" }],
        404,
      );
    }

    const departmentsResult = await query(
      `
      SELECT
        id,
        code,
        name,
        slug,
        about,
        is_active
      FROM departments
      WHERE school_id = $1
      ORDER BY name ASC
      `,
      [id],
    );

    // Frontend integration note: keep school + nested department list in one payload
    // so department listing pages can render without making an immediate second call.
    return successResponse(res, "School fetched successfully", {
      ...mapSchoolRow(schoolResult.rows[0]),
      departments: departmentsResult.rows.map((department) => ({
        id: department.id,
        code: department.code,
        name: department.name,
        slug: department.slug,
        about: department.about,
        isActive: department.is_active,
      })),
    });
  } catch (error) {
    if (error.code === "42P01") {
      return errorResponse(
        res,
        "School not found",
        [{ field: "id", message: "No school found for the provided id" }],
        404,
      );
    }

    return errorResponse(
      res,
      "Failed to fetch school details",
      [{ field: "school", message: error.message }],
      500,
    );
  }
});

module.exports = router;
