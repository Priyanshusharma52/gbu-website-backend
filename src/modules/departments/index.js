const express = require("express");
const { query } = require("../../config/db");
const { successResponse, errorResponse } = require("../../utils/response");
const { authenticate, authorize } = require("../../middleware/auth");
const ROLES = require("../../constants/roles");

const router = express.Router();

const runOptionalQuery = async (sql, params = []) => {
  try {
    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    // Optional entities can be introduced incrementally by migration.
    if (error.code === "42P01") {
      return [];
    }
    throw error;
  }
};

const toDepartmentPayload = (row) => ({
  id: row.id,
  schoolId: row.school_id,
  schoolName: row.school_name,
  code: row.code,
  name: row.name,
  slug: row.slug,
  about: row.about,
  contactEmail: row.contact_email,
  contactPhone: row.contact_phone,
  isActive: row.is_active,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  // Frontend integration note: department page sections are grouped in one object
  // so page blocks (about/achievements/placements/labs) can bind directly.
  dynamicBlocks: {
    about: row.about || "",
    achievements: [],
    placements: [],
    labs: [],
  },
});

router.get("/departments", async (req, res) => {
  try {
    const departmentsResult = await query(
      `
			SELECT
				d.id,
				d.school_id,
				s.name AS school_name,
				d.code,
				d.name,
				d.slug,
				d.about,
				d.contact_email,
				d.contact_phone,
				d.is_active,
				d.created_at,
				d.updated_at
			FROM departments d
			INNER JOIN schools s ON s.id = d.school_id
			ORDER BY s.name ASC, d.name ASC
			`,
    );

    return successResponse(
      res,
      "Departments fetched successfully",
      departmentsResult.rows.map(toDepartmentPayload),
    );
  } catch (error) {
    if (error.code === "42P01") {
      return successResponse(res, "Departments fetched successfully", []);
    }

    return errorResponse(
      res,
      "Failed to fetch departments",
      [{ field: "departments", message: error.message }],
      500,
    );
  }
});

router.get("/departments/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    const departmentResult = await query(
      `
			SELECT
				d.id,
				d.school_id,
				s.name AS school_name,
				d.code,
				d.name,
				d.slug,
				d.about,
				d.contact_email,
				d.contact_phone,
				d.is_active,
				d.created_at,
				d.updated_at
			FROM departments d
			INNER JOIN schools s ON s.id = d.school_id
			WHERE d.slug = $1
			LIMIT 1
			`,
      [slug],
    );

    if (!departmentResult.rows.length) {
      return errorResponse(
        res,
        "Department not found",
        [{ field: "slug", message: "No department found for this slug" }],
        404,
      );
    }

    const department = toDepartmentPayload(departmentResult.rows[0]);
    const departmentId = department.id;

    const [contacts, notices, labs, boardsOfStudy, programs] =
      await Promise.all([
        runOptionalQuery(
          `
				SELECT id, name, designation, email, phone
				FROM department_contacts
				WHERE department_id = $1
				ORDER BY name ASC
				`,
          [departmentId],
        ),
        runOptionalQuery(
          `
				SELECT id, title, content, notice_type, published_at
				FROM department_notices
				WHERE department_id = $1
				ORDER BY published_at DESC NULLS LAST, created_at DESC
				`,
          [departmentId],
        ),
        runOptionalQuery(
          `
				SELECT id, name, description, location, incharge_name
				FROM labs
				WHERE department_id = $1
				ORDER BY name ASC
				`,
          [departmentId],
        ),
        runOptionalQuery(
          `
				SELECT id, title, member_name, member_role, tenure_start, tenure_end
				FROM boards_of_study
				WHERE department_id = $1
				ORDER BY tenure_start DESC NULLS LAST
				`,
          [departmentId],
        ),
        query(
          `
				SELECT id, code, name, level, duration_years, intake_capacity, is_active
				FROM programs
				WHERE department_id = $1
				ORDER BY level ASC, name ASC
				`,
          [departmentId],
        ).then((result) => result.rows),
      ]);

    const achievementItems = notices.filter(
      (item) => String(item.notice_type || "").toLowerCase() === "achievement",
    );
    const placementItems = notices.filter(
      (item) => String(item.notice_type || "").toLowerCase() === "placement",
    );

    return successResponse(res, "Department fetched successfully", {
      ...department,
      dynamicBlocks: {
        about: department.about || "",
        achievements: achievementItems,
        placements: placementItems,
        labs,
      },
      contacts,
      notices,
      labs,
      boardsOfStudy,
      programs,
    });
  } catch (error) {
    if (error.code === "42P01") {
      return errorResponse(
        res,
        "Department not found",
        [{ field: "slug", message: "No department found for this slug" }],
        404,
      );
    }

    return errorResponse(
      res,
      "Failed to fetch department details",
      [{ field: "department", message: error.message }],
      500,
    );
  }
});

router.post(
  "/departments",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  async (req, res) => {
    const {
      schoolId,
      code,
      name,
      slug,
      about,
      contactEmail,
      contactPhone,
      isActive = true,
    } = req.body;

    if (!schoolId || !code || !name || !slug) {
      return errorResponse(
        res,
        "Validation failed",
        [
          { field: "schoolId", message: "schoolId is required" },
          { field: "code", message: "code is required" },
          { field: "name", message: "name is required" },
          { field: "slug", message: "slug is required" },
        ],
        400,
      );
    }

    const normalizedCode = String(code).trim().toUpperCase();

    try {
      const schoolResult = await query(
        "SELECT id FROM schools WHERE id = $1 LIMIT 1",
        [schoolId],
      );

      if (!schoolResult.rows.length) {
        return errorResponse(
          res,
          "Validation failed",
          [{ field: "schoolId", message: "Provided schoolId does not exist" }],
          400,
        );
      }

      // Business rule: department code should be unique globally (CSE/ECE style codes).
      const codeCheckResult = await query(
        "SELECT id FROM departments WHERE UPPER(code) = UPPER($1) LIMIT 1",
        [normalizedCode],
      );

      if (codeCheckResult.rows.length) {
        return errorResponse(
          res,
          "Validation failed",
          [
            {
              field: "code",
              message: "Department code must be unique across all schools",
            },
          ],
          409,
        );
      }

      const insertResult = await query(
        `
				INSERT INTO departments (
					school_id,
					code,
					name,
					slug,
					about,
					contact_email,
					contact_phone,
					is_active,
					created_by,
					updated_by
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
				RETURNING
					id,
					school_id,
					code,
					name,
					slug,
					about,
					contact_email,
					contact_phone,
					is_active,
					created_at,
					updated_at
				`,
        [
          schoolId,
          normalizedCode,
          String(name).trim(),
          String(slug).trim(),
          about || null,
          contactEmail || null,
          contactPhone || null,
          Boolean(isActive),
          req.user.sub,
        ],
      );

      const row = insertResult.rows[0];

      return successResponse(
        res,
        "Department created successfully",
        {
          ...toDepartmentPayload({ ...row, school_name: null }),
          schoolId: row.school_id,
        },
        201,
      );
    } catch (error) {
      if (error.code === "23505") {
        return errorResponse(
          res,
          "Validation failed",
          [
            {
              field: "department",
              message: "Department with same slug/name/code already exists",
            },
          ],
          409,
        );
      }

      return errorResponse(
        res,
        "Failed to create department",
        [{ field: "department", message: error.message }],
        500,
      );
    }
  },
);

router.put(
  "/departments/:id",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  async (req, res) => {
    const { id } = req.params;
    const {
      schoolId,
      code,
      name,
      slug,
      about,
      contactEmail,
      contactPhone,
      isActive,
    } = req.body;

    try {
      const existingResult = await query(
        "SELECT * FROM departments WHERE id = $1 LIMIT 1",
        [id],
      );

      if (!existingResult.rows.length) {
        return errorResponse(
          res,
          "Department not found",
          [{ field: "id", message: "No department found for provided id" }],
          404,
        );
      }

      const existing = existingResult.rows[0];
      const nextSchoolId = schoolId || existing.school_id;
      const nextCode = code ? String(code).trim().toUpperCase() : existing.code;
      const nextName = name ? String(name).trim() : existing.name;
      const nextSlug = slug ? String(slug).trim() : existing.slug;
      const nextAbout = about !== undefined ? about : existing.about;
      const nextContactEmail =
        contactEmail !== undefined ? contactEmail : existing.contact_email;
      const nextContactPhone =
        contactPhone !== undefined ? contactPhone : existing.contact_phone;
      const nextIsActive =
        isActive !== undefined ? Boolean(isActive) : existing.is_active;

      if (schoolId) {
        const schoolResult = await query(
          "SELECT id FROM schools WHERE id = $1 LIMIT 1",
          [schoolId],
        );

        if (!schoolResult.rows.length) {
          return errorResponse(
            res,
            "Validation failed",
            [
              {
                field: "schoolId",
                message: "Provided schoolId does not exist",
              },
            ],
            400,
          );
        }
      }

      if (nextCode !== existing.code) {
        const codeCheckResult = await query(
          "SELECT id FROM departments WHERE UPPER(code) = UPPER($1) AND id <> $2 LIMIT 1",
          [nextCode, id],
        );

        if (codeCheckResult.rows.length) {
          return errorResponse(
            res,
            "Validation failed",
            [
              {
                field: "code",
                message: "Department code must be unique across all schools",
              },
            ],
            409,
          );
        }
      }

      const updateResult = await query(
        `
				UPDATE departments
				SET
					school_id = $1,
					code = $2,
					name = $3,
					slug = $4,
					about = $5,
					contact_email = $6,
					contact_phone = $7,
					is_active = $8,
					updated_by = $9,
					updated_at = NOW()
				WHERE id = $10
				RETURNING
					id,
					school_id,
					code,
					name,
					slug,
					about,
					contact_email,
					contact_phone,
					is_active,
					created_at,
					updated_at
				`,
        [
          nextSchoolId,
          nextCode,
          nextName,
          nextSlug,
          nextAbout,
          nextContactEmail,
          nextContactPhone,
          nextIsActive,
          req.user.sub,
          id,
        ],
      );

      return successResponse(res, "Department updated successfully", {
        ...toDepartmentPayload({ ...updateResult.rows[0], school_name: null }),
        schoolId: updateResult.rows[0].school_id,
      });
    } catch (error) {
      if (error.code === "23505") {
        return errorResponse(
          res,
          "Validation failed",
          [
            {
              field: "department",
              message: "Department with same slug/name/code already exists",
            },
          ],
          409,
        );
      }

      return errorResponse(
        res,
        "Failed to update department",
        [{ field: "department", message: error.message }],
        500,
      );
    }
  },
);

module.exports = router;
