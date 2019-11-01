# React redux immutable
## Getting started

```
new Reducer(httpApp, 'todos', {
  paginate: true,
  fieldsToNormalizeWith: ['_id'],
  socketApp,
  listenToChange: true
});
```
```
httpApp is a @feathersjs/rest-client
socketApp is a @feathersjs/socketio-client
```