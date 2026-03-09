const buildSort = ({ sortBy = 'createdAt', order = 'DESC' } = {}) => {
  return {
    sortBy,
    order: String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
  };
};

module.exports = {
  buildSort,
};
