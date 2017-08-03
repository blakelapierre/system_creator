import {transform} from 'babel-core';
import es2015 from 'babel-preset-es2015';
import transformReactJsx from 'babel-plugin-transform-react-jsx';

import attachControls from './attachControls';
import debounce from './util/debounce';
import unindent from './util/unindent';

import {compressToEncodedURIComponent, decompressFromEncodedURIComponent} from 'lz-string';

window.compressToEncodedURIComponent = compressToEncodedURIComponent;
window.decompressFromEncodedURIComponent = decompressFromEncodedURIComponent;

window.addEventListener('error', error => {
  console.log(error);
  return false;
});


const timeToUpdate = 1000; // In milliseconds

// pretty terrible globals
window.mathboxes = window.mathboxes || [];
let boxes = window.mathboxes;

document.body.addEventListener('resize', event => {
  boxes.forEach(box => {
    const {width, height, _view} = box.parentNode;
    _view._context.setSize(width, height);
  });
});

class SimulatedView {
  constructor() {
    this.three = {
      renderer: {
        setClearColor: (...params) => {
          console.log('setting', ...params);
          this.clearColorParams = params;
        }
      }
    };
  }

  playback(mathbox) {
    console.log({mathbox, color: this.clearColorParams});
    if (this.clearColorParams) mathbox.three.renderer.setClearColor(...this.clearColorParams);
  }
}

class Scene {
  constructor() {

    this._simulatedView = new SimulatedView();
  }

  update(parentNode, commands, controls, result, view) {
    this.parentNode = parentNode;
    this.commands = commands;
    this.controls = controls;
    this.result = result;
    this._view = view;

    this._simulatedView.playback(view);
    this._simulatedView = undefined;
  }

  get view() {
    return this._view || this._simulatedView;
  }
}

export default function attachMathBox(code, parentNode) {
  // const compressedCode = window.location.search || window.location.hash;
  // if (compressedCode) {
  //   code = decompressFromEncodedURIComponent(compressedCode.substr(1));
  // }

  const newScene = new Scene();

  boxes.push(newScene);

  const {view, result, root} = handleMathBoxJsx(unindent(code))(parentNode),
        {callback, commands, controls, onMathBoxViewBuilt} = result;

  // build(view, root);

  // if (onMathBoxViewBuilt) onMathBoxViewBuilt(view, controls, commands);
  // if (controls) attachControls(view, controls, commands);

  // newScene.update(parentNode, commands, controls, result, view);

  if (callback) callback(view);
}

function handleMathBoxJsx(code) {
  return parentNode => {
    const {result, root, cancel} = runMathBoxJsx(compile(code).code, parentNode),
          {attachTo, cameraControls, editorPanel, plugins, camera} = result;

    const element = attachTo || parentNode; // kind of strange. oh well

    // const container = document.createElement('mathbox-container');
    // element.appendChild(container);

    // if (editorPanel) attachPanel(element, root);

    // const view = mathBox({
    //   // element,
    //   element: container,
    //   plugins: plugins || ['core', 'cursor'],
    //   controls: {
    //     // klass: cameraControls || THREE.OrbitControls
    //     klass: THREE.OrbitControls
    //   },
    //   camera: camera
    // }), thumbnailCanvas = document.createElement('canvas')
    //   , thumbnailContext = thumbnailCanvas.getContext('2d');

    // thumbnailCanvas.width = view._context.canvas.width / 5;
    // thumbnailCanvas.height = view._context.canvas.height / 5;

    // element.addEventListener('resize', event => console.log('resize', event));

    return {result, root};
  };

  function runMathBoxJsx(code, parentNode) {
    let root, realRoot;

    const JMB = {
      // We'll just assemble our VDOM-like here.
      createElement: (name, props, ...children) => (root = ({name, props, children}))
    };

    // const setInterval = fakeSetInterval,;

    const views = {};
    function render(root, el = parentNode) {
      let view = views[el];

      if (!view) view = views[el] = createView(el);
      else view.remove('*');

      build(view, root);

      return view;

      function createView(element, plugins, camera) {
        const view = mathBox({
          element,
          plugins: plugins || ['core', 'cursor', 'controls'],
          controls: {
            // klass: cameraControls || THREE.OrbitControls
            klass: THREE.OrbitControls
          },
          camera
        });

        return view;
      }
    }

    // function render(something) {
    //   realRoot = something;
    // }

    // function rerender(something) {
    //   view.
    // }

    const intervals = [],
          result = eval(code) || {};

    return {result, root: realRoot || root, cancel};

    // function fakeSetInterval(...args) {
    function setInterval(...args) {
      intervals.push(window.setInterval.apply(window, args));
    }

    function cancel() {
      intervals.forEach(clearInterval);
      intervals.splice(0);
    }
  }
}

function compile(text) {
  return transform(text, {
    presets: [es2015],
    plugins: [[transformReactJsx, {pragma: 'JMB.createElement'}]]
  });
}

function build(view, {name, children, props}) {
  if (name !== 'root') view = handleChild(name, props, view);

  (children || []).forEach(child => build(view, child));

  return view;
}

function handleChild(name, props, view) {
  let props1 = {}, props2;

  for (let propName in props) handleProp(propName, props[propName]);

  // view = view[name](props1, props2);
  return view[name](props1, props2);

  function handleProp(propName, prop) {
    if (typeof prop === 'function' && (name === 'camera' || (propName !== 'expr'))) (props2 = (props2 || {}))[propName] = prop;
    else (props1 = (props1 || {}))[propName] = prop;
  }
}

function createSelect(values = [], defaultValue = values[0], names = values) {
  const select = document.createElement('select');

  names.forEach(name => {
    const option = document.createElement('option');

    option.value = name;
    option.innerHTML = name;

    if (name === defaultValue) option.selected = true;

    select.appendChild(option);
  });

  return select;
}