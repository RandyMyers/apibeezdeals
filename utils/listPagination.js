/** Query params for catalog list endpoints: ?limit=&skip= */

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

function parseListPagination(query = {}, options = {}) {
  const def = options.defaultLimit ?? DEFAULT_LIMIT;
  const max = options.maxLimit ?? MAX_LIMIT;
  const rawLimit = query.limit;
  const rawSkip = query.skip;

  const nLimit = Number(rawLimit);
  const nSkip = Number(rawSkip);

  const limit =
    rawLimit === undefined || rawLimit === ""
      ? def
      : Math.min(Math.max(1, Number.isFinite(nLimit) ? nLimit : def), max);

  const skip =
    rawSkip === undefined || rawSkip === ""
      ? 0
      : Math.max(0, Number.isFinite(nSkip) ? nSkip : 0);

  return { limit, skip };
}

module.exports = { parseListPagination, DEFAULT_LIMIT, MAX_LIMIT };
