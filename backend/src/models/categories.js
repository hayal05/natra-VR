// categories — global platform categories.
//
// Categories are platform-wide and are managed by the Master Admin.
// Restaurants may read/select these categories when creating foods,
// but they do not own or modify category records.

const crudFactory = require('../utils/crudFactory');

const categories = crudFactory({
  table: 'categories',
  columns: ['name'],
});

module.exports = categories;
