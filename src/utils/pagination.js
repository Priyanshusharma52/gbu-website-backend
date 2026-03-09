const getPagination = ({ page = 1, limit = 10, total = 0 }) => {
  const parsedPage = Math.max(Number(page) || 1, 1);
  const parsedLimit = Math.max(Number(limit) || 10, 1);
  const pages = Math.ceil(total / parsedLimit) || 1;

  return {
    page: parsedPage,
    limit: parsedLimit,
    total,
    pages,
    offset: (parsedPage - 1) * parsedLimit,
  };
};

module.exports = {
  getPagination,
};
