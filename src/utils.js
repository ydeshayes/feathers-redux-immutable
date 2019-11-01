import { Map } from 'immutable';

export const getNormalizedDataPath = (data, fieldsToNormalizeWith) => {
  return fieldsToNormalizeWith.map(field => data && data.get(field));
};

export const mapQueryResultToData = (
  queryResult,
  data,
  fieldsToNormalizeWith
) => {
  return queryResult.map(q =>
    data
      .getIn([...getNormalizedDataPath(q, fieldsToNormalizeWith)], new Map())
      .toJS()
  );
};

export const getStatePart = (state, name) => state[name] || new Map();

export default { getNormalizedDataPath, mapQueryResultToData, getStatePart };
