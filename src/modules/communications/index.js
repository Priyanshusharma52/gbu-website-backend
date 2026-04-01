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
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

const toDateISOString = (value) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
};

const toDateOnlyString = (value) => {
  const isoString = toDateISOString(value);
  if (!isoString) {
    return null;
  }
  return isoString.slice(0, 10);
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

  const expandedItems = sourceItems.flatMap((item) => String(item).split(","));

  const cleaned = expandedItems
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(cleaned)];
};

const slugify = (value) => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/-{2,}/g, "-");
};

const isUuid = (value) => {
  return UUID_REGEX.test(String(value || ""));
};

const getActorUserId = (req) => {
  const actorId = req?.user?.sub;
  return isUuid(actorId) ? actorId : null;
};

const writeAuditLog = async (
  client,
  { actorUserId, action, resourceType, resourceId, requestId, metadata },
) => {
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
      actorUserId,
      action,
      resourceType,
      resourceId,
      requestId || null,
      metadata ? JSON.stringify(metadata) : null,
    ],
  );
};

const mapAnnouncement = (row) => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  summary: row.summary,
  content: row.content,
  category: row.category,
  tags: row.tags || [],
  coverImageUrl: row.cover_image_url,
  publishedAt: row.published_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapNewsItem = (row) => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  summary: row.summary,
  content: row.content,
  category: row.category,
  tags: row.tags || [],
  sourceUrl: row.source_url,
  coverImageUrl: row.cover_image_url,
  publishedAt: row.published_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapEvent = (row) => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  summary: row.summary,
  description: row.description,
  category: row.category,
  venue: row.venue,
  organizer: row.organizer,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  coverImageUrl: row.cover_image_url,
  registrationUrl: row.registration_url,
  isFeatured: row.is_featured,
  isPublished: row.is_published,
  publishedAt: row.published_at,
  tags: row.tags || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const parseListFilters = (req, res) => {
  const { search, category, dateFrom, dateTo, tags } = req.query;
  const normalizedSearch = String(search || "").trim();
  const normalizedCategory = String(category || "").trim();
  const normalizedTags = normalizeTags(tags);
  const parsedDateFrom = dateFrom ? toDateISOString(dateFrom) : null;
  const parsedDateTo = dateTo ? toDateISOString(dateTo) : null;

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

  const page = toPositiveInt(req.query.page, 1);
  const limit = Math.min(
    toPositiveInt(req.query.limit, DEFAULT_LIMIT),
    MAX_LIMIT,
  );

  return {
    search: normalizedSearch,
    category: normalizedCategory,
    dateFrom: parsedDateFrom,
    dateTo: parsedDateTo,
    tags: normalizedTags,
    page,
    limit,
  };
};

const appendCommonClauses = ({
  whereClauses,
  params,
  search,
  category,
  dateFrom,
  dateTo,
  tags,
  dateColumn,
  searchColumns,
  tagsFilter,
}) => {
  if (search) {
    const placeholder = `$${params.length + 1}`;
    params.push(`%${search}%`);
    const searchClause = searchColumns
      .map((column) => `COALESCE(${column}, '') ILIKE ${placeholder}`)
      .join(" OR ");
    whereClauses.push(`(${searchClause})`);
  }

  if (category) {
    const placeholder = `$${params.length + 1}`;
    params.push(category.toLowerCase());
    whereClauses.push(`LOWER(category) = ${placeholder}`);
  }

  if (dateFrom) {
    const placeholder = `$${params.length + 1}`;
    params.push(dateFrom);
    whereClauses.push(`${dateColumn} >= ${placeholder}::timestamptz`);
  }

  if (dateTo) {
    const placeholder = `$${params.length + 1}`;
    params.push(dateTo);
    whereClauses.push(`${dateColumn} <= ${placeholder}::timestamptz`);
  }

  if (tags?.length && tagsFilter) {
    const placeholder = `$${params.length + 1}`;
    params.push(tags);
    whereClauses.push(tagsFilter(placeholder));
  }
};

router.get("/announcements", async (req, res) => {
  const filters = parseListFilters(req, res);
  if (!filters) {
    return;
  }

  try {
    const whereClauses = ["is_published = TRUE"];
    const params = [];

    appendCommonClauses({
      whereClauses,
      params,
      search: filters.search,
      category: filters.category,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      tags: filters.tags,
      dateColumn: "published_at",
      searchColumns: ["title", "summary", "content"],
      tagsFilter: (placeholder) => `tags && ${placeholder}::text[]`,
    });

    const whereSql = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM announcements ${whereSql}`,
      params,
    );
    const total = Number(countResult.rows[0]?.total || 0);
    const pagination = getPagination({
      page: filters.page,
      limit: filters.limit,
      total,
    });

    const listResult = await query(
      `
      SELECT
        id,
        title,
        slug,
        summary,
        content,
        category,
        tags,
        cover_image_url,
        published_at,
        created_at,
        updated_at
      FROM announcements
      ${whereSql}
      ORDER BY published_at DESC NULLS LAST, created_at DESC
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
    const whereClauses = ["is_published = TRUE"];
    const params = [];

    appendCommonClauses({
      whereClauses,
      params,
      search: filters.search,
      category: filters.category,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      tags: filters.tags,
      dateColumn: "published_at",
      searchColumns: ["title", "summary", "content"],
      tagsFilter: (placeholder) => `tags && ${placeholder}::text[]`,
    });

    const whereSql = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM news_items ${whereSql}`,
      params,
    );
    const total = Number(countResult.rows[0]?.total || 0);
    const pagination = getPagination({
      page: filters.page,
      limit: filters.limit,
      total,
    });

    const listResult = await query(
      `
      SELECT
        id,
        title,
        slug,
        summary,
        content,
        category,
        tags,
        source_url,
        cover_image_url,
        published_at,
        created_at,
        updated_at
      FROM news_items
      ${whereSql}
      ORDER BY published_at DESC NULLS LAST, created_at DESC
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
    const whereClauses = ["e.is_published = TRUE"];
    const params = [];

    appendCommonClauses({
      whereClauses,
      params,
      search: filters.search,
      category: filters.category,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      tags: filters.tags,
      dateColumn: "e.starts_at",
      searchColumns: ["e.title", "e.summary", "e.description", "e.venue"],
      tagsFilter: (placeholder) =>
        `EXISTS (
          SELECT 1
          FROM event_tags etf
          WHERE etf.event_id = e.id
            AND LOWER(etf.tag) = ANY(${placeholder}::text[])
        )`,
    });

    const whereSql = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    const countResult = await query(
      `SELECT COUNT(DISTINCT e.id)::int AS total FROM events e ${whereSql}`,
      params,
    );
    const total = Number(countResult.rows[0]?.total || 0);
    const pagination = getPagination({
      page: filters.page,
      limit: filters.limit,
      total,
    });

    const listResult = await query(
      `
      SELECT
        e.id,
        e.title,
        e.slug,
        e.summary,
        e.description,
        e.category,
        e.venue,
        e.organizer,
        e.starts_at,
        e.ends_at,
        e.cover_image_url,
        e.registration_url,
        e.is_featured,
        e.is_published,
        e.published_at,
        e.created_at,
        e.updated_at,
        COALESCE(
          ARRAY_AGG(DISTINCT et.tag) FILTER (WHERE et.tag IS NOT NULL),
          '{}'::text[]
        ) AS tags
      FROM events e
      LEFT JOIN event_tags et ON et.event_id = e.id
      ${whereSql}
      GROUP BY e.id
      ORDER BY e.starts_at DESC NULLS LAST, e.created_at DESC
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
  const { id } = req.params;

  if (!isUuid(id)) {
    return errorResponse(
      res,
      "Validation failed",
      [{ field: "id", message: "Event id must be a valid UUID" }],
      400,
    );
  }

  try {
    const eventResult = await query(
      `
      SELECT
        e.id,
        e.title,
        e.slug,
        e.summary,
        e.description,
        e.category,
        e.venue,
        e.organizer,
        e.starts_at,
        e.ends_at,
        e.cover_image_url,
        e.registration_url,
        e.is_featured,
        e.is_published,
        e.published_at,
        e.created_at,
        e.updated_at,
        COALESCE(
          ARRAY_AGG(DISTINCT et.tag) FILTER (WHERE et.tag IS NOT NULL),
          '{}'::text[]
        ) AS tags
      FROM events e
      LEFT JOIN event_tags et ON et.event_id = e.id
      WHERE e.id = $1
        AND e.is_published = TRUE
      GROUP BY e.id
      LIMIT 1
      `,
      [id],
    );

    if (!eventResult.rows.length) {
      return errorResponse(
        res,
        "Event not found",
        [{ field: "id", message: "No published event found for this id" }],
        404,
      );
    }

    const mediaResult = await query(
      `
      SELECT
        id,
        title,
        caption,
        media_type,
        file_url,
        thumbnail_url,
        display_order,
        created_at,
        updated_at
      FROM media_gallery_items
      WHERE event_id = $1
      ORDER BY display_order ASC, created_at DESC
      `,
      [id],
    );

    return successResponse(res, "Event fetched successfully", {
      ...mapEvent(eventResult.rows[0]),
      mediaGalleryItems: mediaResult.rows.map((item) => ({
        id: item.id,
        title: item.title,
        caption: item.caption,
        mediaType: item.media_type,
        fileUrl: item.file_url,
        thumbnailUrl: item.thumbnail_url,
        displayOrder: item.display_order,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
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
  const { id } = req.params;
  const limit = Math.min(
    toPositiveInt(req.query.limit, RELATED_EVENTS_DEFAULT_LIMIT),
    RELATED_EVENTS_MAX_LIMIT,
  );

  if (!isUuid(id)) {
    return errorResponse(
      res,
      "Validation failed",
      [{ field: "id", message: "Event id must be a valid UUID" }],
      400,
    );
  }

  try {
    const baseEventResult = await query(
      `
      SELECT id, category
      FROM events
      WHERE id = $1
        AND is_published = TRUE
      LIMIT 1
      `,
      [id],
    );

    if (!baseEventResult.rows.length) {
      return errorResponse(
        res,
        "Event not found",
        [{ field: "id", message: "No published event found for this id" }],
        404,
      );
    }

    const relatedResult = await query(
      `
      WITH base AS (
        SELECT id, category
        FROM events
        WHERE id = $1
      ),
      base_tags AS (
        SELECT LOWER(tag) AS tag
        FROM event_tags
        WHERE event_id = $1
      )
      SELECT
        e.id,
        e.title,
        e.slug,
        e.summary,
        e.description,
        e.category,
        e.venue,
        e.organizer,
        e.starts_at,
        e.ends_at,
        e.cover_image_url,
        e.registration_url,
        e.is_featured,
        e.is_published,
        e.published_at,
        e.created_at,
        e.updated_at,
        COALESCE(
          ARRAY_AGG(DISTINCT et.tag) FILTER (WHERE et.tag IS NOT NULL),
          '{}'::text[]
        ) AS tags,
        (
          CASE
            WHEN base.category IS NOT NULL
              AND LOWER(e.category) = LOWER(base.category)
            THEN 1
            ELSE 0
          END
          + COALESCE(
              (
                SELECT COUNT(*)::int
                FROM event_tags et2
                INNER JOIN base_tags bt ON LOWER(et2.tag) = bt.tag
                WHERE et2.event_id = e.id
              ),
              0
            )
        ) AS relevance_score
      FROM events e
      CROSS JOIN base
      LEFT JOIN event_tags et ON et.event_id = e.id
      WHERE e.id <> $1
        AND e.is_published = TRUE
        AND (
          (base.category IS NOT NULL AND LOWER(e.category) = LOWER(base.category))
          OR EXISTS (
            SELECT 1
            FROM event_tags et3
            INNER JOIN base_tags bt ON LOWER(et3.tag) = bt.tag
            WHERE et3.event_id = e.id
          )
        )
      GROUP BY e.id, base.category
      ORDER BY relevance_score DESC, e.starts_at ASC NULLS LAST, e.created_at DESC
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
      slug,
      summary,
      description,
      category,
      venue,
      organizer,
      startsAt,
      endsAt,
      coverImageUrl,
      registrationUrl,
      isFeatured = false,
      isPublished = true,
      tags,
    } = req.body;

    const requiredFieldErrors = [];

    if (!title) {
      requiredFieldErrors.push({
        field: "title",
        message: "title is required",
      });
    }

    if (!startsAt) {
      requiredFieldErrors.push({
        field: "startsAt",
        message: "startsAt is required",
      });
    }

    if (requiredFieldErrors.length) {
      return errorResponse(res, "Validation failed", requiredFieldErrors, 400);
    }

    const parsedStartsAt = toDateISOString(startsAt);
    const parsedEndsAt = endsAt ? toDateISOString(endsAt) : null;

    if (!parsedStartsAt) {
      return errorResponse(
        res,
        "Validation failed",
        [{ field: "startsAt", message: "startsAt must be a valid date" }],
        400,
      );
    }

    if (endsAt && !parsedEndsAt) {
      return errorResponse(
        res,
        "Validation failed",
        [{ field: "endsAt", message: "endsAt must be a valid date" }],
        400,
      );
    }

    if (parsedEndsAt && parsedStartsAt > parsedEndsAt) {
      return errorResponse(
        res,
        "Validation failed",
        [{ field: "dateRange", message: "startsAt cannot be after endsAt" }],
        400,
      );
    }

    const eventSlug = slug ? slugify(slug) : slugify(title);

    if (!eventSlug) {
      return errorResponse(
        res,
        "Validation failed",
        [{ field: "slug", message: "Unable to generate a valid slug" }],
        400,
      );
    }

    const normalizedTags = normalizeTags(tags);
    const actorUserId = getActorUserId(req);
    const client = await getDbPool().connect();

    try {
      await client.query("BEGIN");

      const insertEventResult = await client.query(
        `
        INSERT INTO events (
          title,
          slug,
          summary,
          description,
          category,
          venue,
          organizer,
          starts_at,
          ends_at,
          cover_image_url,
          registration_url,
          is_featured,
          is_published,
          published_at,
          created_by,
          updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8::timestamptz, $9::timestamptz,
          $10, $11,
          $12, $13,
          CASE WHEN $13 THEN NOW() ELSE NULL END,
          $14, $14
        )
        RETURNING
          id,
          title,
          slug,
          summary,
          description,
          category,
          venue,
          organizer,
          starts_at,
          ends_at,
          cover_image_url,
          registration_url,
          is_featured,
          is_published,
          published_at,
          created_at,
          updated_at
        `,
        [
          String(title).trim(),
          eventSlug,
          summary || null,
          description || null,
          category || null,
          venue || null,
          organizer || null,
          parsedStartsAt,
          parsedEndsAt,
          coverImageUrl || null,
          registrationUrl || null,
          Boolean(isFeatured),
          Boolean(isPublished),
          actorUserId,
        ],
      );

      const createdEvent = insertEventResult.rows[0];

      if (normalizedTags.length) {
        await client.query(
          `
          INSERT INTO event_tags (event_id, tag)
          SELECT $1, UNNEST($2::text[])
          `,
          [createdEvent.id, normalizedTags],
        );
      }

      await writeAuditLog(client, {
        actorUserId,
        action: "event.create",
        resourceType: "events",
        resourceId: createdEvent.id,
        requestId: req.requestId,
        metadata: {
          title: createdEvent.title,
          category: createdEvent.category,
          tagsCount: normalizedTags.length,
        },
      });

      await client.query("COMMIT");

      return successResponse(
        res,
        "Event created successfully",
        {
          ...mapEvent({
            ...createdEvent,
            tags: normalizedTags,
          }),
          mediaGalleryItems: [],
        },
        201,
      );
    } catch (error) {
      await client.query("ROLLBACK");

      if (error.code === "23505") {
        return errorResponse(
          res,
          "Validation failed",
          [{ field: "event", message: "Event slug already exists" }],
          409,
        );
      }

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

    const requiredFieldErrors = [];

    if (!title) {
      requiredFieldErrors.push({
        field: "title",
        message: "title is required",
      });
    }

    if (!issueDate) {
      requiredFieldErrors.push({
        field: "issueDate",
        message: "issueDate is required",
      });
    }

    if (requiredFieldErrors.length) {
      return errorResponse(res, "Validation failed", requiredFieldErrors, 400);
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

    const actorUserId = getActorUserId(req);
    const client = await getDbPool().connect();

    try {
      await client.query("BEGIN");

      const insertResult = await client.query(
        `
        INSERT INTO newsletter_issues (
          title,
          issue_no,
          issue_date,
          summary,
          content_html,
          pdf_url,
          cover_image_url,
          is_published,
          published_at,
          created_by,
          updated_by
        ) VALUES (
          $1, $2, $3::date, $4, $5, $6, $7, $8,
          CASE WHEN $8 THEN NOW() ELSE NULL END,
          $9, $9
        )
        RETURNING
          id,
          title,
          issue_no,
          issue_date,
          summary,
          content_html,
          pdf_url,
          cover_image_url,
          is_published,
          published_at,
          created_at,
          updated_at
        `,
        [
          String(title).trim(),
          issueNo || null,
          parsedIssueDate,
          summary || null,
          contentHtml || null,
          pdfUrl || null,
          coverImageUrl || null,
          Boolean(isPublished),
          actorUserId,
        ],
      );

      const newsletter = insertResult.rows[0];

      await writeAuditLog(client, {
        actorUserId,
        action: "newsletter.create",
        resourceType: "newsletter_issues",
        resourceId: newsletter.id,
        requestId: req.requestId,
        metadata: {
          title: newsletter.title,
          issueNo: newsletter.issue_no,
          issueDate: newsletter.issue_date,
        },
      });

      await client.query("COMMIT");

      return successResponse(
        res,
        "Newsletter created successfully",
        {
          id: newsletter.id,
          title: newsletter.title,
          issueNo: newsletter.issue_no,
          issueDate: newsletter.issue_date,
          summary: newsletter.summary,
          contentHtml: newsletter.content_html,
          pdfUrl: newsletter.pdf_url,
          coverImageUrl: newsletter.cover_image_url,
          isPublished: newsletter.is_published,
          publishedAt: newsletter.published_at,
          createdAt: newsletter.created_at,
          updatedAt: newsletter.updated_at,
        },
        201,
      );
    } catch (error) {
      await client.query("ROLLBACK");

      if (error.code === "23505") {
        return errorResponse(
          res,
          "Validation failed",
          [{ field: "issueNo", message: "issueNo already exists" }],
          409,
        );
      }

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
