const express = require("express");
const { query } = require("../../config/db");
const { successResponse, errorResponse } = require("../../utils/response");

const router = express.Router();

const toDateOnlyString = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
};

const mapRecruitmentRow = (row) => {
  const closingDate = toDateOnlyString(row.closing_date);
  const publishedDate = toDateOnlyString(row.published_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsedClosingDate = closingDate ? new Date(closingDate) : null;
  const isArchived = parsedClosingDate ? parsedClosingDate < today : false;
  const effectiveDate = closingDate || publishedDate;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    referenceNo: row.reference_no,
    category: row.category,
    tabId: row.tab_id,
    publishedDate,
    closingDate,
    year: effectiveDate ? Number.parseInt(effectiveDate.slice(0, 4), 10) : null,
    isArchived,
    status: isArchived ? "archived" : "current",
    documents: Array.isArray(row.documents) ? row.documents : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const groupItemsByCategory = (items) => {
  return items.reduce((accumulator, item) => {
    const key = item.category || "others";
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(item);
    return accumulator;
  }, {});
};

const groupItemsByYear = (items) => {
  return items.reduce((accumulator, item) => {
    const key = String(item.year || "unknown");
    if (!accumulator[key]) {
      accumulator[key] = [];
    }
    accumulator[key].push(item);
    return accumulator;
  }, {});
};

const listRecruitments = async (req, res) => {
  try {
    const result = await query(
      `
			SELECT
				r.id,
				r.title,
				r.description,
				r.reference_no,
				r.category,
				r.tab_id,
				r.published_date,
				r.closing_date,
				r.created_at,
				r.updated_at,
				COALESCE(
					json_agg(
						json_build_object(
							'id', d.id,
							'name', d.name,
							'documentType', d.document_type,
							'url', d.file_url,
							'description', d.description,
							'sortOrder', d.sort_order
						)
						ORDER BY d.sort_order ASC, d.id ASC
					) FILTER (WHERE d.id IS NOT NULL),
					'[]'::json
				) AS documents
			FROM recruitments r
			LEFT JOIN recruitment_documents d
				ON d.recruitment_id = r.id
				AND d.is_active = TRUE
      WHERE r.is_active = TRUE
			GROUP BY r.id
			ORDER BY r.closing_date DESC NULLS LAST, r.published_date DESC NULLS LAST, r.id DESC
			`,
    );

    const items = result.rows.map(mapRecruitmentRow);
    const current = items.filter((item) => item.status === "current");
    const archived = items.filter((item) => item.status === "archived");

    return successResponse(res, "Recruitments fetched successfully", {
      items,
      current,
      archived,
      currentByCategory: groupItemsByCategory(current),
      archivedByYear: groupItemsByYear(archived),
      meta: {
        total: items.length,
        currentCount: current.length,
        archivedCount: archived.length,
      },
    });
  } catch (error) {
    if (error.code === "42P01") {
      return errorResponse(
        res,
        "Failed to fetch recruitments",
        [
          {
            field: "recruitments",
            message:
              "Recruitment tables do not exist. Run the DB schema setup for recruitments.",
          },
        ],
        500,
      );
    }

    return errorResponse(
      res,
      "Failed to fetch recruitments",
      [{ field: "recruitments", message: error.message }],
      500,
    );
  }
};

router.get("/recruitments", listRecruitments);

module.exports = router;
