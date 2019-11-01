import { createSelector } from 'reselect';

import { mapQueryResultToData, getNormalizedDataPath } from './utils';

const getFilteredDataForQueryResult = (
  getQueryResult,
  getData,
  fieldsToNormalizeWithFct
) =>
  createSelector(
    [getQueryResult, getData, fieldsToNormalizeWithFct],
    (queryResult, data, fieldsToNormalizeWith) =>
      data.filter(
        d =>
          queryResult.find(q =>
            d.getIn([...getNormalizedDataPath(q, fieldsToNormalizeWith)])
          ) !== -1
      )
  );

const mapQueryResultToDataSelector = (
  getQueryResult,
  getData,
  fieldsToNormalizeWith
) =>
  createSelector(
    [getQueryResult, getData, fieldsToNormalizeWith],
    mapQueryResultToData
  );

const mapQueryResultToFilteredDataSelector = (
  getQueryResult,
  getData,
  fieldsToNormalizeWith
) => {
  const getFilteredDataForQueryResultSelector = getFilteredDataForQueryResult(
    getQueryResult,
    getData,
    fieldsToNormalizeWith
  );

  return mapQueryResultToDataSelector(
    getQueryResult,
    getFilteredDataForQueryResultSelector,
    fieldsToNormalizeWith
  );
};

export default mapQueryResultToFilteredDataSelector;
