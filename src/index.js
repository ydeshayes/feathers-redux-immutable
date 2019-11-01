import ReducerClass from './reducer';
import mapQueryResultToFilteredDataSelector from './reducer';
import utilsFunction from './utils';

export const Reducer = ReducerClass;
export const select = mapQueryResultToFilteredDataSelector;
export const utils = utilsFunction;
