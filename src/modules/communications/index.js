const express = require("express");
const { query, getDbPool } = require("../../config/db");
const { successResponse, errorResponse } = require("../../utils/response");
const { getPagination } = require("../../utils/pagination");
const { authenticate, authorize } = require("../../middleware/auth");
const ROLES = require("../../constants/roles");

const router = express.Router();

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 50;

const ANNOUNCEMENT_SORT_FIELDS = {
  date: "date",
  title: "title",
  category: "type",
  priority: "priority",
  views: "views",
};

const NEWS_SORT_FIELDS = {
  date: "date",
  title: "title",
  category: "category",
  priority: "priority",
  views: "views",
  likes: "likes",
};

const EVENTS_SORT_FIELDS = {
  date: "e.date",
  title: "e.title",
  category: "e.type",
  attendees: "e.attendees",
  year: "e.year",
};

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

const normalizeOrder = (order) => {
  return String(order || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
};

const buildSortClause = ({ sortBy, order, sortFields, fallbackSortBy }) => {
  const selectedColumn = sortFields[sortBy] || sortFields[fallbackSortBy];
  const selectedOrder = normalizeOrder(order);
  if (!selectedColumn) {
    return "id DESC";
  }
  return `${selectedColumn} ${selectedOrder}, id DESC`;
};

const toDateOnlyString = (value) => {
  if (!value) {
    return null;
  }
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }
  return parsedDate.toISOString().slice(0, 10);
};

const parseTimeString = (value) => {
  if (!value) {
    return null;
  }
  const normalized = String(value).trim();
  const isValid = /^([01]\d|2[0-3]):[0-5]\d$/.test(normalized);
  return isValid ? normalized : null;
};

const normalizeTags = (rawTags) => {
  if (rawTags === undefined || rawTags === null || rawTags === "") {
    return [];
  }
  const sourceItems = Array.isArray(rawTags)
    ? rawTags
    : String(rawTags)
        .split(",")
        .map((item) => item.trim());
  return [
    ...new Set(sourceItems.map((item) => item.toLowerCase()).filter(Boolean)),
  ];
};

const parseTagString = (tagText) => {
  if (!tagText) {
    return [];
  }

  if (Array.isArray(tagText)) {
    return tagText
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean);
  }

  if (typeof tagText === "string") {
    const normalized = tagText.trim();
    if (!normalized) {
      return [];
    }

    if (normalized.startsWith("[") && normalized.endsWith("]")) {
      try {
        const parsed = JSON.parse(normalized);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => String(item).trim().toLowerCase())
            .filter(Boolean);
        }
      } catch (error) {
        // Fallback to comma split below.
      }
    }

    return normalized
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  return [];
};

const normalizeJsonArray = (rawValue) => {
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return [];
  }

  if (Array.isArray(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      return [];
    }

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const formatTimestampForApi = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 19);
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(normalized)) {
    const asIso = normalized.replace(" ", "T");
    return asIso.length === 16 ? `${asIso}:00` : asIso;
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 19);
};

const parseTimestampInput = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 19).replace("T", " ");
};

const parseEventId = (value) => {
  if (!/^\d+$/.test(String(value || ""))) {
    return null;
  }
  return Number.parseInt(value, 10);
};

const buildEventStartIso = (eventDate, eventTime) => {
  if (!eventDate) {
    return null;
  }

  const normalizedDate =
    toDateOnlyString(eventDate) ||
    (/^\d{4}-\d{2}-\d{2}$/.test(String(eventDate || ""))
      ? String(eventDate)
      : null);

  if (!normalizedDate) {
    return null;
  }

  const safeTime = parseTimeString(eventTime) || "00:00";
  return `${normalizedDate}T${safeTime}:00`;
};

const writeAuditLog = async (
  client,
  { actorUserId, action, resourceType, resourceId, requestId, metadata },
) => {
  try {
    await client.query(
      `
      INSERT INTO audit_logs (
        actor_user_id,
        action,
        resource_type,
        resource_id,
        request_id,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `,
      [
        actorUserId || null,
        action,
        resourceType,
        resourceId || null,
        requestId || null,
        metadata ? JSON.stringify(metadata) : null,
      ],
    );
  } catch (error) {
    if (error.code === "42P01") {
      return;
    }
    throw error;
  }
};

const appendCommonClauses = ({
  whereClauses,
  params,
  search,
  category,
  dateFrom,
  dateTo,
  tags,
  searchColumns,
  categoryColumn,
  dateColumn,
  tagsFilter,
}) => {
  if (search) {
    const placeholder = `$${params.length + 1}`;
    params.push(`%${search}%`);
    whereClauses.push(
      `(${searchColumns
        .map((column) => `COALESCE(${column}, '') ILIKE ${placeholder}`)
        .join(" OR ")})`,
    );
  }

  if (category) {
    const placeholder = `$${params.length + 1}`;
    params.push(category.toLowerCase());
    whereClauses.push(`LOWER(${categoryColumn}) = ${placeholder}`);
  }

  if (dateFrom) {
    const placeholder = `$${params.length + 1}`;
    params.push(dateFrom);
    whereClauses.push(`${dateColumn} >= ${placeholder}::date`);
  }

  if (dateTo) {
    const placeholder = `$${params.length + 1}`;
    params.push(dateTo);
    whereClauses.push(`${dateColumn} <= ${placeholder}::date`);
  }

  if (tags.length && tagsFilter) {
    const placeholder = `$${params.length + 1}`;
    params.push(tags);
    whereClauses.push(tagsFilter(placeholder));
  }
};

const mapAnnouncement = (row) => ({
  id: row.id,
  title: row.title,
  slug: `notice-${row.id}`,
  summary: row.content,
  content: row.content,
  category: row.type,
  tags: [
    String(row.type || "").toLowerCase(),
    String(row.priority || "").toLowerCase(),
  ].filter(Boolean),
  coverImageUrl: row.pdf_url,
  publishedAt: row.date,
  createdAt: null,
  updatedAt: null,
  priority: row.priority,
  views: row.views,
  isNew: row.is_new,
  pdfUrl: row.pdf_url,
});

const mapNewsItem = (row) => ({
  id: row.id,
  title: row.title,
  slug: `news-${row.id}`,
  summary: row.excerpt,
  content: row.content,
  category: row.category,
  tags: parseTagString(row.tags),
  sourceUrl: null,
  coverImageUrl: row.image_url,
  publishedAt: row.date,
  createdAt: null,
  updatedAt: null,
  author: row.author,
  department: row.department,
  priority: row.priority,
  views: row.views,
  likes: row.likes,
  featured: row.featured,
  status: row.status,
});

const mapEvent = (row) => {
  const startsAt =
    formatTimestampForApi(row.starts_at) ||
    buildEventStartIso(row.date, row.time);
  const endsAt = formatTimestampForApi(row.ends_at);
  const venue = row.venue || row.location || null;
  const coverImageUrl = row.cover_image || row.image || null;
  const tags = parseTagString(row.tags);
  const timeString = row.time_string || row.time || null;

  return {
    id: row.id,
    title: row.title,
    slug: `event-${row.id}`,
    summary: row.description,
    description: row.description,
    category: row.type,
    venue,
    organizer: row.organizer,
    startsAt,
    endsAt,
    coverImageUrl,
    registrationUrl: row.registration_url || null,
    isFeatured: false,
    isPublished: String(row.status || "").toLowerCase() !== "draft",
    publishedAt: startsAt,
    tags,
    createdAt: null,
    updatedAt: null,
    attendees: row.attendees,
    status: row.status,
    price: row.price,
    year: row.year,
    date: startsAt ? startsAt.slice(0, 10) : null,
    time: timeString,
    location: venue,
    type: row.type,
    mode: row.mode || "Offline",
    gallery: normalizeJsonArray(row.gallery),
    agenda: normalizeJsonArray(row.agenda),
    speakers: normalizeJsonArray(row.speakers),
  };
};

const parseListFilters = (req, res) => {
  const { search, category, dateFrom, dateTo, tags, sortBy, order } = req.query;
  const parsedDateFrom = dateFrom ? toDateOnlyString(dateFrom) : null;
  const parsedDateTo = dateTo ? toDateOnlyString(dateTo) : null;

  if (dateFrom && !parsedDateFrom) {
    errorResponse(
      res,
      "Validation failed",
      [{ field: "dateFrom", message: "dateFrom must be a valid date" }],
      400,
    );
    return null;
  }

  if (dateTo && !parsedDateTo) {
    errorResponse(
      res,
      "Validation failed",
      [{ field: "dateTo", message: "dateTo must be a valid date" }],
      400,
    );
    return null;
  }

  if (parsedDateFrom && parsedDateTo && parsedDateFrom > parsedDateTo) {
    errorResponse(
      res,
      "Validation failed",
      [{ field: "dateRange", message: "dateFrom cannot be after dateTo" }],
      400,
    );
    return null;
  }

  return {
    search: String(search || "").trim(),
    category: String(category || "").trim(),
    dateFrom: parsedDateFrom,
    dateTo: parsedDateTo,
    tags: normalizeTags(tags),
    sortBy: String(sortBy || "").trim(),
    order: String(order || "").trim(),
    page: toPositiveInt(req.query.page, 1),
    limit: Math.min(toPositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT),
  };
};

router.get("/announcements", async (req, res) => {
  const filters = parseListFilters(req, res);
  if (!filters) {
    return;
  }

  try {
    const whereClauses = ["1=1"];
    const params = [];

    appendCommonClauses({
      whereClauses,
      params,
      search: filters.search,
      category: filters.category,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      tags: filters.tags,
      searchColumns: ["title", "content", "type"],
      categoryColumn: "type",
      dateColumn: "date",
      tagsFilter: (placeholder) =>
        `EXISTS (
          SELECT 1
          FROM unnest(${placeholder}::text[]) AS t(tag)
          WHERE LOWER(COALESCE(type, '')) = t.tag
             OR LOWER(COALESCE(priority, '')) = t.tag
             OR COALESCE(content, '') ILIKE '%' || t.tag || '%'
        )`,
    });

    const whereSql = `WHERE ${whereClauses.join(" AND ")}`;
    const sortSql = buildSortClause({
      sortBy: filters.sortBy,
      order: filters.order,
      sortFields: ANNOUNCEMENT_SORT_FIELDS,
      fallbackSortBy: "date",
    });

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM notices ${whereSql}`,
      params,
    );

    const pagination = getPagination({
      page: filters.page,
      limit: filters.limit,
      total: Number(countResult.rows[0]?.total || 0),
    });

    const listResult = await query(
      `
      SELECT id, title, content, date, type, priority, views, is_new, pdf_url
      FROM notices
      ${whereSql}
      ORDER BY ${sortSql}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, pagination.limit, pagination.offset],
    );

    return successResponse(
      res,
      "Announcements fetched successfully",
      listResult.rows.map(mapAnnouncement),
      200,
      pagination,
    );
  } catch (error) {
    return errorResponse(
      res,
      "Failed to fetch announcements",
      [{ field: "announcements", message: error.message }],
      500,
    );
  }
});

router.get("/news", async (req, res) => {
  const filters = parseListFilters(req, res);
  if (!filters) {
    return;
  }

  try {
    const whereClauses = ["1=1"];
    const params = [];

    appendCommonClauses({
      whereClauses,
      params,
      search: filters.search,
      category: filters.category,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      tags: filters.tags,
      searchColumns: ["title", "excerpt", "content", "author", "department"],
      categoryColumn: "category",
      dateColumn: "date",
      tagsFilter: (placeholder) =>
        `EXISTS (
          SELECT 1
          FROM unnest(${placeholder}::text[]) AS t(tag)
          WHERE COALESCE(tags, '') ILIKE '%' || t.tag || '%'
        )`,
    });

    const whereSql = `WHERE ${whereClauses.join(" AND ")}`;
    const sortSql = buildSortClause({
      sortBy: filters.sortBy,
      order: filters.order,
      sortFields: NEWS_SORT_FIELDS,
      fallbackSortBy: "date",
    });

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM news ${whereSql}`,
      params,
    );

    const pagination = getPagination({
      page: filters.page,
      limit: filters.limit,
      total: Number(countResult.rows[0]?.total || 0),
    });

    const listResult = await query(
      `
      SELECT
        id, title, excerpt, content, date, author, department,
        tags, category, priority, views, likes, image_url, featured, status
      FROM news
      ${whereSql}
      ORDER BY ${sortSql}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, pagination.limit, pagination.offset],
    );

    return successResponse(
      res,
      "News fetched successfully",
      listResult.rows.map(mapNewsItem),
      200,
      pagination,
    );
  } catch (error) {
    return errorResponse(
      res,
      "Failed to fetch news",
      [{ field: "news", message: error.message }],
      500,
    );
  }
});

router.get("/events", async (req, res) => {
  try {
    const listResult = await query(
      `
      SELECT
        id,
        title,
        description,
        starts_at,
        time_string,
        venue,
        organizer,
        type,
        mode,
        status,
        price,
        attendees,
        cover_image,
        tags,
        year
      FROM events
      ORDER BY starts_at ASC, id ASC
      `,
    );

    return res.status(200).json({
      success: true,
      count: listResult.rowCount,
      data: listResult.rows,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.get("/events/:id", async (req, res) => {
  const id = parseEventId(req.params.id);

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid event id" });
  }

  try {
    const eventResult = await query(
      `
      SELECT *
      FROM events
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );

    if (!eventResult.rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    return res.status(200).json({
      success: true,
      data: eventResult.rows[0],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});

router.post(
  "/events",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  async (req, res) => {
    const {
      title,
      description,
      organizer,
      venue,
      location,
      type,
      category,
      mode,
      status,
      price,
      attendees = 0,
      startsAt,
      starts_at,
      endsAt,
      ends_at,
      date,
      time,
      timeString,
      time_string,
      year,
      coverImageUrl,
      cover_image,
      image,
      registrationUrl,
      registration_url,
      tags,
      gallery,
      agenda,
      speakers,
    } = req.body;

    if (!title) {
      return errorResponse(
        res,
        "Validation failed",
        [{ field: "title", message: "title is required" }],
        400,
      );
    }

    const startsAtInput = startsAt || starts_at;
    const endsAtInput = endsAt || ends_at;

    const parsedDate = toDateOnlyString(date);
    const parsedTime = parseTimeString(time) || "00:00";
    const normalizedStartsAt =
      parseTimestampInput(startsAtInput) ||
      (parsedDate ? `${parsedDate} ${parsedTime}:00` : null);

    if (!normalizedStartsAt) {
      return errorResponse(
        res,
        "Validation failed",
        [{ field: "startsAt", message: "startsAt or date is required" }],
        400,
      );
    }

    const normalizedEndsAt = parseTimestampInput(endsAtInput);
    const normalizedVenue = String(venue || location || "").trim() || null;
    const normalizedType = String(type || category || "General").trim();
    const normalizedMode = String(mode || "Offline").trim();
    const normalizedStatus = String(status || "upcoming").trim();
    const normalizedPrice = String(price || "Free").trim();

    const parsedAttendees = Number.parseInt(attendees, 10);
    const safeAttendees = Number.isNaN(parsedAttendees) ? 0 : parsedAttendees;

    const normalizedTimeString = String(
      timeString ||
        time_string ||
        parseTimeString(time) ||
        normalizedStartsAt.slice(11, 16),
    ).trim();
    const normalizedYear = String(
      year || normalizedStartsAt.slice(0, 4),
    ).trim();
    const normalizedCoverImage = cover_image || coverImageUrl || image || null;
    const normalizedRegistrationUrl =
      registration_url || registrationUrl || null;

    const normalizedTags = normalizeTags(tags);
    const normalizedGallery = normalizeJsonArray(gallery);
    const normalizedAgenda = normalizeJsonArray(agenda);
    const normalizedSpeakers = normalizeJsonArray(speakers);

    const client = await getDbPool().connect();

    try {
      await client.query("BEGIN");

      const insertResult = await client.query(
        `
        INSERT INTO events (
          title,
          description,
          organizer,
          venue,
          type,
          mode,
          status,
          price,
          attendees,
          starts_at,
          ends_at,
          time_string,
          year,
          cover_image,
          registration_url,
          tags,
          gallery,
          agenda,
          speakers
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10::timestamp,
          $11::timestamp,
          $12,
          $13,
          $14,
          $15,
          $16::jsonb,
          $17::jsonb,
          $18::jsonb,
          $19::jsonb
        )
        RETURNING *
        `,
        [
          String(title).trim(),
          description || null,
          organizer || null,
          normalizedVenue,
          normalizedType,
          normalizedMode,
          normalizedStatus,
          normalizedPrice,
          safeAttendees,
          normalizedStartsAt,
          normalizedEndsAt,
          normalizedTimeString,
          normalizedYear,
          normalizedCoverImage,
          normalizedRegistrationUrl,
          JSON.stringify(normalizedTags),
          JSON.stringify(normalizedGallery),
          JSON.stringify(normalizedAgenda),
          JSON.stringify(normalizedSpeakers),
        ],
      );

      const createdEvent = insertResult.rows[0];

      await writeAuditLog(client, {
        actorUserId: req?.user?.sub,
        action: "event.create",
        resourceType: "events",
        resourceId: null,
        requestId: req.requestId,
        metadata: { eventId: createdEvent.id, title: String(title).trim() },
      });

      await client.query("COMMIT");

      return successResponse(
        res,
        "Event created successfully",
        mapEvent(createdEvent),
        201,
      );
    } catch (error) {
      await client.query("ROLLBACK");
      return errorResponse(
        res,
        "Failed to create event",
        [{ field: "event", message: error.message }],
        500,
      );
    } finally {
      client.release();
    }
  },
);

router.post(
  "/newsletters",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  async (req, res) => {
    const {
      title,
      issueNo,
      issueDate,
      summary,
      contentHtml,
      pdfUrl,
      coverImageUrl,
      isPublished = true,
    } = req.body;

    if (!title || !issueDate) {
      return errorResponse(
        res,
        "Validation failed",
        [
          { field: "title", message: "title is required" },
          { field: "issueDate", message: "issueDate is required" },
        ],
        400,
      );
    }

    const parsedIssueDate = toDateOnlyString(issueDate);
    if (!parsedIssueDate) {
      return errorResponse(
        res,
        "Validation failed",
        [{ field: "issueDate", message: "issueDate must be a valid date" }],
        400,
      );
    }

    const client = await getDbPool().connect();

    try {
      await client.query("BEGIN");

      const nextIdResult = await client.query(
        "SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM news",
      );
      const nextId = Number(nextIdResult.rows[0].next_id);

      const contentParts = [
        summary || "",
        contentHtml || "",
        pdfUrl ? `PDF: ${pdfUrl}` : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      await client.query(
        `
        INSERT INTO news (
          id, title, excerpt, content, date, author, department,
          tags, category, priority, views, likes, image_url, featured, status
        ) VALUES (
          $1, $2, $3, $4, $5::date, $6, $7,
          $8, $9, $10, $11, $12, $13, $14, $15
        )
        `,
        [
          nextId,
          String(title).trim(),
          summary || String(title).trim(),
          contentParts || summary || String(title).trim(),
          parsedIssueDate,
          req?.user?.name || "System",
          "Communications",
          issueNo ? `newsletter,${issueNo}` : "newsletter",
          "Newsletter",
          "medium",
          0,
          0,
          coverImageUrl || null,
          false,
          isPublished ? "published" : "draft",
        ],
      );

      await writeAuditLog(client, {
        actorUserId: req?.user?.sub,
        action: "newsletter.create",
        resourceType: "news",
        resourceId: null,
        requestId: req.requestId,
        metadata: {
          newsId: nextId,
          title: String(title).trim(),
          issueNo: issueNo || null,
        },
      });

      await client.query("COMMIT");

      return successResponse(
        res,
        "Newsletter created successfully",
        {
          id: nextId,
          title: String(title).trim(),
          issueNo: issueNo || null,
          issueDate: parsedIssueDate,
          summary: summary || String(title).trim(),
          contentHtml: contentHtml || null,
          pdfUrl: pdfUrl || null,
          coverImageUrl: coverImageUrl || null,
          isPublished: Boolean(isPublished),
        },
        201,
      );
    } catch (error) {
      await client.query("ROLLBACK");
      return errorResponse(
        res,
        "Failed to create newsletter",
        [{ field: "newsletter", message: error.message }],
        500,
      );
    } finally {
      client.release();
    }
  },
);

module.exports = router;
