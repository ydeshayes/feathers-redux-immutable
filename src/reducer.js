import { Map, fromJS, List } from 'immutable';

const DEFAULT_APP_NAME = 'app';
const DEFAULT_LIMIT = 10;
const DEFAULT_METHODS = ['get', 'find', 'create', 'patch', 'remove'];

class Reducer {
  constructor(app, serviceName, options = {}) {
    this.app = app;
    this.serviceName = serviceName;
    this.options = options;
    if (!this.options.limit) {
      this.options.limit = DEFAULT_LIMIT;
    }
    if (!this.options.appName) {
      this.options.appName = DEFAULT_APP_NAME;
    }
    this.generateMethods();
  }

  getFieldsToNormalizeWith = () => this.options.fieldsToNormalizeWith;

  getReducerName = () => {
    return (this.options && this.options.reducerName) || this.serviceName;
  };

  generateMethods = () => {
    const methods = this.options.methods || DEFAULT_METHODS;

    methods.forEach(m => {
      this[m] = this.createMethod(m);
    });
  };

  setFindState = (newData, immutableState) => {
    let data = newData;

    let state = immutableState;

    if (this.options.paginate) {
      let queryResultData = fromJS(
        newData.data.map(d => this.getQueryObject(d))
      );

      if (newData.skip !== 0) {
        // If we load other than page 1
        queryResultData = immutableState
          .get('queryResult', new List())
          .concat(queryResultData);
      }
      state = immutableState
        .set('queryResult', queryResultData)
        .set('total', newData.total)
        .set('skip', newData.skip)
        .set('limit', newData.limit);
      data = newData.data;
    }

    data.forEach(d => {
      state = this.normalize(d, state).updateIn(['cache'], new List(), cache =>
        cache.push(d._id)
      );
    });

    return state;
  };

  getQueryObject = data => {
    return this.options.fieldsToNormalizeWith.reduce((acc, current) => {
      acc[current] = data[current];
      return acc;
    }, {});
  };

  getSetterValues = data =>
    this.options.fieldsToNormalizeWith.map(field => data[field]);

  normalize = (newData, immutableState, finalValue = newData) => {
    const setterValues = this.getSetterValues(newData);

    return immutableState.setIn(['data', ...setterValues], fromJS(finalValue));
  };

  removeInState = (data, immutableState) => {
    const setterValues = this.getSetterValues(data);

    if (this.options.paginate) {
      setterValues.unshift('data');
    }

    return immutableState.removeIn(setterValues);
  };

  listenToChange = dispatch => {
    if (!this.options.listenToChange) {
      return false;
    }
    const socketApp = this.options.socketApp;
    const service = socketApp.service(this.serviceName);

    service.on('patched', object =>
      dispatch({
        type: `${this.options.appName}/${this.serviceName}/PATCH_EVENT_SUCCESS`,
        payload: object
      })
    );
    service.on('updated', object =>
      dispatch({
        type: `${this.options.appName}/${this.serviceName}/UPDATE_EVENT_SUCCESS`,
        payload: object
      })
    );
    service.on('created', object =>
      dispatch({
        type: `${this.options.appName}/${this.serviceName}/CREATE_EVENT_SUCCESS`,
        payload: object
      })
    );
    service.on('removed', object =>
      dispatch({
        type: `${this.options.appName}/${this.serviceName}/REMOVE_EVENT_SUCCESS`,
        payload: object
      })
    );
  };

  createMethod = method => (...params) => async (dispatch, getState) => {
    dispatch({
      type: `${this.options.appName}/${this.serviceName}/${method.toUpperCase()}_START`
    });
    try {
      let result;

      if (method === 'get') {
        const id = params[0];

        const state = getState();

        const isCached
          = state
          && state[this.getReducerName()]
          && state[this.getReducerName()].get('cache', new List()).indexOf(id)
            !== -1;

        if (isCached) {
          return dispatch({
            type: `${this.options.appName}/${
              this.serviceName
            }/${method.toUpperCase()}_SUCCESS_CACHED`,
            payload: id
          });
        }
      }
      // prettier-ignore
      result = await this.app
        .service(this.serviceName)[method](...params);

      dispatch({
        type: `${this.options.appName}/${this.serviceName}/${method.toUpperCase()}_SUCCESS`,
        payload: result
      });
    } catch (err) {
      dispatch({
        type: `${this.options.appName}/${this.serviceName}/${method.toUpperCase()}_FAILURE`,
        payload: err,
        error: true
      });
      throw err.errors;
    }
  };

  reducer = (state = new Map(), action) => {
    switch (action.type) {
      case `${this.options.appName}/${this.serviceName}/GET_START`:
      case `${this.options.appName}/${this.serviceName}/FIND_START`:
        return state.set('isLoading', true);
      case `${this.options.appName}/${this.serviceName}/SAVE_START`:
      case `${this.options.appName}/${this.serviceName}/UPDATE_START`:
      case `${this.options.appName}/${this.serviceName}/PATCH_START`:
        return state.set('isSaving', true);
      case `${this.options.appName}/${this.serviceName}/FIND_SUCCESS`:
        return this.setFindState(action.payload, state).set('isLoading', false);
      case `${this.options.appName}/${this.serviceName}/GET_SUCCESS`:
        return this.normalize(action.payload, state)
          .set('isLoading', false)
          .updateIn(['cache'], new List(), cache =>
            cache.push(action.payload._id)
          );
      case `${this.options.appName}/${this.serviceName}/UPDATE_EVENT_SUCCESS`:
      case `${this.options.appName}/${this.serviceName}/CREATE_EVENT_SUCCESS`:
      case `${this.options.appName}/${this.serviceName}/SAVE_SUCCESS`:
      case `${this.options.appName}/${this.serviceName}/UPDATE_SUCCESS`:
      case `${this.options.appName}/${this.serviceName}/PATCH_EVENT_SUCCESS`:
      case `${this.options.appName}/${this.serviceName}/PATCH_SUCCESS`:
        return this.normalize(action.payload, state).set('isSaving', false);
      case `${this.options.appName}/${this.serviceName}/GET_FAILURE`:
      case `${this.options.appName}/${this.serviceName}/FIND_FAILURE`:
        return state.set('error', action.payload).set('isLoading', false);
      case `${this.options.appName}/${this.serviceName}/SAVE_FAILURE`:
      case `${this.options.appName}/${this.serviceName}/UPDATE_FAILURE`:
      case `${this.options.appName}/${this.serviceName}/PATCH_FAILURE`:
        return state.set('error', action.payload).set('isSaving', false);
      case `${this.options.appName}/${this.serviceName}/REMOVE_START`:
        return state.set('isRemoving', true);
      case `${this.options.appName}/${this.serviceName}/REMOVE_EVENT_SUCCESS`:
      case `${this.options.appName}/${this.serviceName}/REMOVE_SUCCESS`:
        return this.removeInState(action.payload, state).set('isRemoving', false);
      case `${this.options.appName}/${this.serviceName}/REMOVE_FAILURE`:
        return state.set('error', action.payload).set('isRemoving', false);
      default:
        return state;
    }
  };
}

export default Reducer;
