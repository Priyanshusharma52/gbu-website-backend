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

const mapTenderRow = (row) => {
  const closingDate = toDateOnlyString(row.closing_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsedClosingDate = closingDate ? new Date(closingDate) : null;
  const isArchived = parsedClosingDate ? parsedClosingDate < today : false;

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
    isArchived,
    status: isArchived ? "archived" : "current",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

router.get("/tenders", async (req, res) => {
  try {
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

    return successResponse(res, "Tenders fetched successfully", {
      items,
      current,
      archived,
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
        "Failed to fetch tenders",
        [
          {
            field: "tenders",
            message: "Table 'tenders' does not exist. Run the DB schema setup.",
          },
        ],
        500,
      );
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
