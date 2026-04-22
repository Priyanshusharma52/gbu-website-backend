const express = require("express");
const { query } = require("../../config/db");
const { successResponse, errorResponse } = require("../../utils/response");

const router = express.Router();
const CACHE_TTL_MS = Number.parseInt(process.env.API_CACHE_TTL_MS || "60000", 10);
const RESPONSE_CACHE_CONTROL = "public, max-age=30, stale-while-revalidate=120";

let tendersCache = {
  payload: null,
  expiresAt: 0,
};

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

const mapTenderRow = (row) => {
  const closingDate = toDateOnlyString(row.closing_date);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    referenceNo: row.reference_no,
    category: row.category,
    tenderType: row.tender_type,
    publishedDate: toDateOnlyString(row.published_date),
    closingDate,
    documentUrl: row.document_url,
    isArchived: row.is_archived,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

router.get("/tenders", async (req, res) => {
  try {
    if (tendersCache.payload && Date.now() < tendersCache.expiresAt) {
      res.set("Cache-Control", RESPONSE_CACHE_CONTROL);
      return successResponse(res, "Tenders fetched successfully", tendersCache.payload);
    }

    const result = await query(
      `
			SELECT
				id,
				title,
				description,
				reference_no,
				category,
				tender_type,
				published_date,
				closing_date,
				document_url,
        (closing_date IS NOT NULL AND closing_date < CURRENT_DATE) AS is_archived,
        CASE
          WHEN closing_date IS NOT NULL AND closing_date < CURRENT_DATE THEN 'archived'
          ELSE 'current'
        END AS status,
				created_at,
				updated_at
			FROM tenders
      WHERE is_active = TRUE
			ORDER BY closing_date ASC NULLS LAST, id DESC
			`,
    );

    const items = result.rows.map(mapTenderRow);
    const current = items.filter((item) => item.status === "current");
    const archived = items.filter((item) => item.status === "archived");

    const payload = {
      items,
      current,
      archived,
      meta: {
        total: items.length,
        currentCount: current.length,
        archivedCount: archived.length,
      },
    };

    tendersCache = {
      payload,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    res.set("Cache-Control", RESPONSE_CACHE_CONTROL);

    return successResponse(res, "Tenders fetched successfully", payload);
  } catch (error) {
    if (error.code === "42P01") {
      return successResponse(res, "Tenders fetched successfully", {
        items: [],
        current: [],
        archived: [],
        meta: {
          total: 0,
          currentCount: 0,
          archivedCount: 0,
        },
      });
    }

    return errorResponse(
      res,
      "Failed to fetch tenders",
      [{ field: "tenders", message: error.message }],
      500,
    );
  }
});

module.exports = router;
