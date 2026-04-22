const express = require("express");
const { query } = require("../../config/db");
const { successResponse, errorResponse } = require("../../utils/response");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const bookingsResult = await query(
      `
      SELECT
        id,
        start_time AS "startTime",
        end_time AS "endTime",
        purpose,
        organizing_dept AS "organizingDept",
        contact_email AS "contactEmail",
        contact_mobile AS "contactMobile"
      FROM booking_requests
      ORDER BY id DESC
      `,
    );

    return successResponse(
      res,
      "Bookings fetched successfully",
      bookingsResult.rows,
    );
  } catch (error) {
    if (error.code === "42P01") {
      return successResponse(res, "Bookings fetched successfully", []);
    }

    return errorResponse(
      res,
      "Failed to fetch bookings",
      [{ field: "booking", message: error.message }],
      500,
    );
  }
});

router.get("/test", (req, res) => {
  res.send("Booking route working");
});

router.post("/", async (req, res) => {
  const {
    startTime,
    endTime,
    purpose,
    organizingDept,
    contactEmail,
    contactMobile,
  } = req.body;

  if (!startTime || !endTime || !purpose || !organizingDept) {
    return errorResponse(
      res,
      "Validation failed",
      [
        { field: "startTime", message: "startTime is required" },
        { field: "endTime", message: "endTime is required" },
        { field: "purpose", message: "purpose is required" },
        { field: "organizingDept", message: "organizingDept is required" },
      ],
      400,
    );
  }

  try {
    const result = await query(
      `
      INSERT INTO booking_requests (
        start_time,
        end_time,
        purpose,
        organizing_dept,
        contact_email,
        contact_mobile
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
      `,
      [
        startTime,
        endTime,
        String(purpose).trim(),
        String(organizingDept).trim(),
        contactEmail || null,
        contactMobile || null,
      ],
    );

    return successResponse(res, "Booking request submitted successfully", {
      id: result.rows[0]?.id || null,
    });
  } catch (error) {
    if (error.code === "42P01") {
      // Keep endpoint non-breaking in environments where booking tables are pending migration.
      return successResponse(res, "Booking request received", {
        id: null,
        saved: false,
        reason: "booking_requests table is not available in current schema",
      });
    }

    return errorResponse(
      res,
      "Failed to submit booking request",
      [{ field: "booking", message: error.message }],
      500,
    );
  }
});

module.exports = router;
