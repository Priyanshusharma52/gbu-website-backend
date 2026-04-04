const express = require("express");
const { query, getDbPool } = require("../../config/db");
const { successResponse, errorResponse } = require("../../utils/response");
const { getPagination } = require("../../utils/pagination");
const { authenticate, authorize } = require("../../middleware/auth");
const ROLES = require("../../constants/roles");

const router = express.Router();

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const RELATED_EVENTS_DEFAULT_LIMIT = 4;
const RELATED_EVENTS_MAX_LIMIT = 12;

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
  return String(tagText)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
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

const mapEvent = (row) => ({
  id: row.id,
  title: row.title,
  slug: `event-${row.id}`,
  summary: row.description,
  description: row.description,
  category: row.type,
  venue: row.location,
  organizer: row.organizer,
  startsAt: buildEventStartIso(row.date, row.time),
  endsAt: null,
  coverImageUrl: row.image,
  registrationUrl: null,
  isFeatured: false,
  isPublished: String(row.status || "").toLowerCase() !== "draft",
  publishedAt: row.date,
  tags: parseTagString(row.tags),
  createdAt: null,
  updatedAt: null,
  attendees: row.attendees,
  status: row.status,
  price: row.price,
  year: row.year,
  date: row.date,
  time: row.time,
  location: row.location,
  type: row.type,
});

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
      searchColumns: [
        "e.title",
        "e.description",
        "e.organizer",
        "e.location",
        "e.type",
      ],
      categoryColumn: "e.type",
      dateColumn: "e.date",
      tagsFilter: (placeholder) =>
        `EXISTS (
          SELECT 1
          FROM unnest(${placeholder}::text[]) AS t(tag)
          WHERE COALESCE(e.tags, '') ILIKE '%' || t.tag || '%'
        )`,
    });

    const whereSql = `WHERE ${whereClauses.join(" AND ")}`;
    const sortSql = buildSortClause({
      sortBy: filters.sortBy,
      order: filters.order,
      sortFields: EVENTS_SORT_FIELDS,
      fallbackSortBy: "date",
    });

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM events e ${whereSql}`,
      params,
    );

    const pagination = getPagination({
      page: filters.page,
      limit: filters.limit,
      total: Number(countResult.rows[0]?.total || 0),
    });

    const listResult = await query(
      `
      SELECT id, title, organizer, date, time, location, type, description,
             image, attendees, status, price, tags, year
      FROM events e
      ${whereSql}
      ORDER BY ${sortSql}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
      `,
      [...params, pagination.limit, pagination.offset],
    );

    return successResponse(
      res,
      "Events fetched successfully",
      listResult.rows.map(mapEvent),
      200,
      pagination,
    );
  } catch (error) {
    return errorResponse(
      res,
      "Failed to fetch events",
      [{ field: "events", message: error.message }],
      500,
    );
  }
});

router.get("/events/:id", async (req, res) => {
  const id = parseEventId(req.params.id);

  if (!id) {
    return errorResponse(
      res,
      "Validation failed",
      [{ field: "id", message: "Event id must be a valid integer" }],
      400,
    );
  }

  try {
    const eventResult = await query(
      `
      SELECT id, title, organizer, date, time, location, type, description,
             image, attendees, status, price, tags, year
      FROM events
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );

    if (!eventResult.rows.length) {
      return errorResponse(
        res,
        "Event not found",
        [{ field: "id", message: "No event found for this id" }],
        404,
      );
    }

    return successResponse(res, "Event fetched successfully", {
      ...mapEvent(eventResult.rows[0]),
      mediaGalleryItems: [],
    });
  } catch (error) {
    return errorResponse(
      res,
      "Failed to fetch event",
      [{ field: "event", message: error.message }],
      500,
    );
  }
});

router.get("/events/:id/related", async (req, res) => {
  const id = parseEventId(req.params.id);
  const limit = Math.min(
    toPositiveInt(req.query.limit, RELATED_EVENTS_DEFAULT_LIMIT),
    RELATED_EVENTS_MAX_LIMIT,
  );

  if (!id) {
    return errorResponse(
      res,
      "Validation failed",
      [{ field: "id", message: "Event id must be a valid integer" }],
      400,
    );
  }

  try {
    const baseEventResult = await query(
      `SELECT id, type, year, tags FROM events WHERE id = $1 LIMIT 1`,
      [id],
    );

    if (!baseEventResult.rows.length) {
      return errorResponse(
        res,
        "Event not found",
        [{ field: "id", message: "No event found for this id" }],
        404,
      );
    }

    const relatedResult = await query(
      `
      WITH base AS (
        SELECT id, type, year,
               regexp_split_to_array(lower(COALESCE(tags, '')), '\\s*,\\s*') AS tag_arr
        FROM events
        WHERE id = $1
      )
      SELECT
        e.id, e.title, e.organizer, e.date, e.time, e.location, e.type,
        e.description, e.image, e.attendees, e.status, e.price, e.tags, e.year,
        (
          CASE WHEN lower(e.type) = lower(base.type) THEN 2 ELSE 0 END
          + CASE WHEN e.year = base.year THEN 1 ELSE 0 END
          + CASE
              WHEN regexp_split_to_array(lower(COALESCE(e.tags, '')), '\\s*,\\s*') && base.tag_arr
              THEN 1 ELSE 0
            END
        ) AS relevance_score
      FROM events e
      CROSS JOIN base
      WHERE e.id <> base.id
        AND (
          lower(e.type) = lower(base.type)
          OR e.year = base.year
          OR regexp_split_to_array(lower(COALESCE(e.tags, '')), '\\s*,\\s*') && base.tag_arr
        )
      ORDER BY relevance_score DESC, e.date DESC, e.time DESC, e.id DESC
      LIMIT $2
      `,
      [id, limit],
    );

    return successResponse(
      res,
      "Related events fetched successfully",
      relatedResult.rows.map(mapEvent),
    );
  } catch (error) {
    return errorResponse(
      res,
      "Failed to fetch related events",
      [{ field: "events", message: error.message }],
      500,
    );
  }
});

router.post(
  "/events",
  authenticate,
  authorize(ROLES.SUPER_ADMIN),
  async (req, res) => {
    const {
      title,
      organizer,
      date,
      time,
      location,
      venue,
      type,
      category,
      description,
      image,
      coverImageUrl,
      attendees = 0,
      status,
      price,
      tags,
      year,
      startsAt,
    } = req.body;

    if (!title) {
      return errorResponse(
        res,
        "Validation failed",
        [{ field: "title", message: "title is required" }],
        400,
      );
    }

    const parsedStart = startsAt ? new Date(startsAt) : null;
    const eventDate =
      toDateOnlyString(date) ||
      (parsedStart && !Number.isNaN(parsedStart.getTime())
        ? parsedStart.toISOString().slice(0, 10)
        : null);
    const eventTime =
      parseTimeString(time) ||
      (parsedStart && !Number.isNaN(parsedStart.getTime())
        ? parsedStart.toISOString().slice(11, 16)
        : "00:00");

    if (!eventDate) {
      return errorResponse(
        res,
        "Validation failed",
        [{ field: "date", message: "date or startsAt is required" }],
        400,
      );
    }

    const normalizedTags = normalizeTags(tags).join(",");
    const normalizedType = String(type || category || "General").trim();
    const normalizedStatus = String(status || "upcoming").trim();
    const normalizedYear = String(year || eventDate.slice(0, 4)).trim();
    const parsedAttendees = Number.parseInt(attendees, 10);
    const safeAttendees = Number.isNaN(parsedAttendees) ? 0 : parsedAttendees;

    const client = await getDbPool().connect();

    try {
      await client.query("BEGIN");

      const nextIdResult = await client.query(
        "SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM events",
      );
      const nextId = Number(nextIdResult.rows[0].next_id);

      await client.query(
        `
        INSERT INTO events (
          id, title, organizer, date, time, location, type, description,
          image, attendees, status, price, tags, year
        ) VALUES (
          $1, $2, $3, $4::date, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14
        )
        `,
        [
          nextId,
          String(title).trim(),
          organizer || null,
          eventDate,
          eventTime,
          location || venue || null,
          normalizedType,
          description || null,
          image || coverImageUrl || null,
          safeAttendees,
          normalizedStatus,
          price || "Free",
          normalizedTags || null,
          normalizedYear,
        ],
      );

      await writeAuditLog(client, {
        actorUserId: req?.user?.sub,
        action: "event.create",
        resourceType: "events",
        resourceId: null,
        requestId: req.requestId,
        metadata: { eventId: nextId, title: String(title).trim() },
      });

      await client.query("COMMIT");

      const createdEventResult = await query(
        `
        SELECT id, title, organizer, date, time, location, type, description,
               image, attendees, status, price, tags, year
        FROM events
        WHERE id = $1
        `,
        [nextId],
      );

      return successResponse(
        res,
        "Event created successfully",
        mapEvent(createdEventResult.rows[0]),
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
