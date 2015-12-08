let boxes = [];

export default function attachControls(view, controls, commands) {
  console.log('attaching', controls, commands, 'to', view);
  if (controls === undefined || commands === undefined) return;

  addListeners(generateActionHandler(controls, define(commands)));

  function define(commands) {
    return dispatch(commands, value => typeof value, {'function': command => command}, createMultiplePropsHandler);

    function createMultiplePropsHandler(command) {
      return view => {
        forEach(command, executeCommand);

        function executeCommand(name, comfmand) {
          const props = command[name],
                {get, set} = proxied(view.select(name));

          forEach(props, updateProp);

          function updateProp(propName, action) {
            let isComplex = typeof action !== 'function',
                getNewValue = isComplex ? getComplexPropValue : action;

            set(propName, getNewValue(get(propName)));

            function getComplexPropValue(propValue) {
              switch (typeof action) {
                case 'function': return action(propValue);
                case 'number': return action;
                default:
                  const {length} = action,
                        fnIndex = length - 1,
                        fn = action[fnIndex],
                        dependencies = action.slice(0, fnIndex).map(get),
                        parameters = [propValue, ...dependencies];

                  return fn.apply(undefined, parameters);
              }
            }
          }
        }
      };
    }
  }

  function dispatch(obj, tagger, handlers, defaultHandler) {
    return mapValues(obj, (name, value) => (handlers[tagger(value, name)] || defaultHandler)(value));
  }

  function generateActionHandler(controls, commands) {
    const actions = buildActions(controls, commands);

    return keyCode => (actions[keyCode] || noActionHandler)(view, keyCode);

    function buildActions(controls, commands) {
      return controls.reduce(addAction, {});

      function addAction(actions, [keys, commandName]) {
        (typeof keys !== 'object' ? [keys] : keys).forEach(setAction);

        return actions;

        function setAction(key) {
          actions[typeof key === 'number' ? key : key.charCodeAt(0)] = commands[commandName];
        }
      }
    }

    function noActionHandler(view, keyCode) { console.log(`No action for ${keyCode} on ${view}`); }
  }

  function addListeners(actionHandler) {
    const box = view._context.canvas.parentElement;
    focusOn(box, 'mousedown');

    if (boxes.length === 0) window.addEventListener('keydown', windowKeydownListener);

    boxes.push({box, actionHandler, view});
  }

  function proxied(obj) {
    return {
      get: (...args) => obj.get.apply(obj, args),
      set: (...args) => obj.set.apply(obj, args)
    };
  }

  function mapValues(obj, t) {
    const ret = {};
    for (let key in obj) ret[key] = t(key, obj[key]);
    return ret;
  }

  function updateValues(obj, t) {
    for (let key in obj) obj[key] = t(key, obj[key]);
    return obj;
  }

  function forEach(obj, fn) {
    for (let key in obj) fn(key, obj[key]);
    return obj;
  }

  function windowKeydownListener(event) {
    const {length} = boxes,
          {target} = event;

    for (let i = 0; i < length; i++) {
      const {box, actionHandler} = boxes[i]; // don't need to pull actionHandler out here for most cases

      if (target === box) {
        actionHandler(event.keyCode);
        return;
      }
    }

    console.log('no handler', event, boxes);
  }
}

function focusOn(el, eventName) { return el.addEventListener(eventName, () => el.focus()); }