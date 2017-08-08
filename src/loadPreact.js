import { h, render, Component } from 'preact';

import {compressToEncodedURIComponent, decompressFromEncodedURIComponent} from 'lz-string';

class Create extends Component {
  constructor(props) {
    super(props);

    this.state = {
      position: [0, 0, 3],
      velocity: [1, 0, 0],
      massBase: 100,
      massExponent: 0,
      get mass() { return this.massBase * Math.pow(10, this.massExponent); },
      color: [0.5, 0.5, 2, 1]
    };
  }

  render({state, actions}) {
    console.log('controls', state, actions);
    return (
      <create>
        {state.tooManyMasses ? 'TOO MANY MASSES!' : ''}
        <table>
          <tbody>
            <tr>
              <td>Position: </td>
              <td>
                <input
                  type="number"
                  value={this.state.position[0]}
                  onChange={({target: {value}}) =>
                              this.setState(({position}) =>
                                position[0] = parseFloat(value, 10)
                              )} />
                <input
                  type="number"
                  value={this.state.position[1]}
                  onChange={({target: {value}}) =>
                              this.setState(({position}) =>
                                position[1] = parseFloat(value, 10)
                              )} />
                <input
                  type="number"
                  value={this.state.position[2]}
                  onChange={({target: {value}}) =>
                              this.setState(({position}) =>
                                position[2] = parseFloat(value, 10)
                              )} />
              </td>
            </tr>
            <tr>
              <td>Velocity: </td>
              <td>
                <input
                  type="number"
                  value={this.state.velocity[0]}
                  onChange={({target: {value}}) =>
                              this.setState(({velocity}) =>
                                velocity[0] = parseFloat(value, 10)
                              )} />
                <input
                  type="number"
                  value={this.state.velocity[1]}
                  onChange={({target: {value}}) =>
                              this.setState(({velocity}) =>
                                velocity[1] = parseFloat(value, 10)
                              )} />
                <input
                  type="number"
                  value={this.state.velocity[2]}
                  onChange={({target: {value}}) =>
                              this.setState(({velocity}) =>
                                velocity[2] = parseFloat(value, 10)
                              )} />
              </td>
            </tr>
            <tr>
              <td>Mass: </td>
              <td>
                <NumberWithExponent state={this.state} base="massBase" exponent="massExponent" />
              </td>
            </tr>
            <tr>
              <td>Color: </td>
              <td>
                <input
                  type="color"
                  value={`#${rgbToHex(Math.round(127 * this.state.color[0])).toString(16)}${rgbToHex(Math.round(127 * this.state.color[1])).toString(16)}${rgbToHex(Math.round(127 * this.state.color[2])).toString(16)}`}
                  onChange={({target: {value}}) => {
                    this.setState(({color}) => {
                      color[0] = parseInt(value.substr(1, 2), 16) / 128,
                      color[1] = parseInt(value.substr(3, 2), 16) / 128,
                      color[2] = parseInt(value.substr(5, 2), 16) / 128
                      return color;
                    });

                    console.log(this.state);
                    // this.state.color[0] = parseInt(value.substr(1, 2), 16);
                    // this.state.color[1] = parseInt(value.substr(3, 2), 16);
                    // this.state.color[2] = parseInt(value.substr(5, 2), 16);
                  }} />
              </td>
            </tr>
          </tbody>
        </table>
        <button onClick={() => actions.create(this.state)}>Create</button>
      </create>
    );

    function rgbToHex(c) {
      const hex = c.toString(16);
      return (hex.length == 1 ? '0' : '') + hex;
    }
  }
}

class NumberWithExponent extends Component {
  constructor(props) {
    super(props);
  }

  render({base, exponent, state}) {
    return (
      <number-with-exponent>
        <Number state={state} valueKey={base} min={1} step={100} onChange={({target: {value}}) => state[base] = parseFloat(value, 10)} />
        <span>x10^</span>
        <Number state={state} valueKey={exponent} min={0} step={1} onChange={({target: {value}}) => state[exponent] = parseFloat(value, 10)} />
      </number-with-exponent>
    );
  }
}

class Number extends Component {
  constructor(props) {
    super(props);

    this.state = {
      [props.valueKey]: props.state[props.valueKey]
    };

    console.log(this.state, props);
  }

  render({state, valueKey, min, step, onChange}) {
    return (
      <number>
        <input type="number" min={min} step={step} value={state[valueKey]} onChange={onChange} />
      </number>
    );
  }
}

class Settings extends Component {
  constructor(props) {
    super(props);

    const {gravityConstant, speedlimit, ticksPerStep, stepsPerSecond, maximumMasses, fieldOfView, saveOnExit} = props.state;

    this.state = {
      gravityConstant,
      speedlimit,
      ticksPerStep,
      stepsPerSecond,
      maximumMasses,
      fieldOfView,
      saveOnExit
    };
  }

  render({state, actions}) {
    const {gravityConstant, speedlimit, ticksPerStep, stepsPerSecond, maximumMasses, fieldOfView, saveOnExit} = this.state;

    return (
      <settings>
        <table>
          <tbody>
            <tr>
              <td>Gravity Constant:</td>
              <td>
                <input
                  type="number"
                  value={gravityConstant}
                  step="0.00000001"
                  onInput={({target: {value}}) => actions['setGravityConstant'](parseFloat(value, 10)) & this.setState({gravityConstant: parseFloat(value, 10)})} />
              </td>
            </tr>
            <tr>
              <td>Speedlimit:</td>
              <td>
                <input
                  type="number"
                  value={speedlimit}
                  step="1"
                  onInput={({target: {value}}) => actions['setSpeedlimit'](parseFloat(value, 10)) & this.setState({speedlimit: parseFloat(value, 10)})} />
              </td>
            </tr>
            <tr>
              <td>Ticks Per Step:</td>
              <td>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={ticksPerStep}
                  onInput={({target: {value}}) => actions['setTicksPerStep'](parseInt(value, 10)) & this.setState({ticksPerStep: parseInt(value, 10)})} />
              </td>
            </tr>
            <tr>
              <td>Steps Per Second:</td>
              <td>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={stepsPerSecond}
                  onInput={({target: {value}}) => actions['setStepsPerSecond'](parseInt(value, 10)) & this.setState({stepsPerSecond: parseInt(value, 10)})} />
              </td>
            </tr>
            <tr>
              <td>Maximum Masses:</td>
              <td>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={maximumMasses}
                  onInput={({target: {value}}) => actions['setMaximumMasses'](parseInt(value, 10)) & this.setState({maximumMasses: parseInt(value, 10)})} />
              </td>
            </tr>
            <tr>
              <td>Field Of View:</td>
              <td>
                <input
                  type="range"
                  min="1"
                  max="179"
                  value={fieldOfView}
                  onInput={({target: {value}}) => actions['setFieldOfView'](parseInt(value, 10)) & this.setState({fieldOfView: parseInt(value, 10)})} /> {fieldOfView} degrees
              </td>
            </tr>
            <tr>
              <td>Save System On Exit:</td>
              <td>
                <input
                  type="checkbox"
                  value={saveOnExit}
                  onClick={({target: {checked}}) => actions['setSaveSystemOnExit'](checked) & this.setState({saveOnExit: checked})} />
              </td>
            </tr>
          </tbody>
        </table>
      </settings>
    );
  }
}

class Controls extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showLoad: false
    };
  }

  render({state, actions}) {
    return (
      <controls>
        <button onClick={actions['restart']}>Restart</button>
        <button onClick={() => actions['save']() & this.setState()}>Save System</button>
        <button onClick={() => this.setState({showLoad: !this.state.showLoad}) & actions['load']}>Load System</button>
        {this.state.showLoad ? <LoadControl state={state} actions={actions} closeControl={() => this.setState({showLoad: false})} /> : undefined}
      </controls>
    );
  }
}

class LoadControl extends Component {
  render({state, actions, closeControl}) {
    const systems = (JSON.parse(localStorage['systems'] || '[]'))
                      .map(([time, system, thumbnail], i) => (
                        <system onClick={() => actions['load'](system) & closeControl()}>
                          <info>
                            <span>{new Date(time).toString()}</span>
                            <span>{system.length}</span>
                            <commands>
                              <share onClick={event => this.setState({system}) & event.stopPropagation()}>S</share>
                              <delete onClick={() => actions['delete'](i) & this.setState()}>D</delete>
                            </commands>
                          </info>
                          <img src={thumbnail} />
                        </system>));
    return (
      <load>
        {systems.reverse()}
        {this.state.system ? <ShareSystem system={this.state.system} actions={actions} close={() => this.setState({system: undefined})} /> : undefined}
      </load>
    );
  }
}

class ShareSystem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      text: 'Get Short Link'
    };
  }

  render({system, close}) {
    const url = `${window.location.href}#${compressToEncodedURIComponent(JSON.stringify(system))}`;

    return (
      <share-system onClick={close}>
        <full-link onClick={event => event.stopPropagation()}>{url}</full-link>
      </share-system>
    );

    //<shorten onClick={shorten}>{this.state.text}</shorten>

    function shorten() {
      const request = new XMLHttpRequest();
      request.addEventListener('load', load);
      request.open('GET', `http://is.gd/create.php?format=simple&url=${url}`);
      request.send();

      function load() {
        console.log(this);
        if (this.status === 200) this.setState({text: this.responseText});
        else this.setState({text: `Failed to shorten link. Status code: ${this.status}`})
      }
    }
  }
}

class View extends Component {
  constructor(props) {
    super(props);

    this.state = {

    };
  }

  render({state, actions}) {
    return (
      <view>
        <button onClick={actions['prevCameraTarget']}>&lt;</button>
        <button onClick={actions['nextCameraTarget']}>&gt;</button>
        <button onClick={actions['targetGreatestMass']}>Greatest Mass</button>
      </view>
    );
  }
}

class Panel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selected: 0
    };
  }

  render({state, actions, children}) {
    console.log('children', children);
    const {selected} = this.state;
    return (
      <panel>
        <header>
          {children.map(({attributes: { header }}, i) =>
            <selector
              className={selected === i ? 'selected' : ''}
              onClick={() => this.setState({selected: i})}
              >{header}</selector>)}
        </header>
        {children[selected]}
      </panel>
    );
  }
}

class UI extends Component {
  render({state, actions}) {
    return (
      <ui>
        <Controls state={state} actions={actions} />
        <Panel>
          <Create
            state={state}
            actions={actions}
            header="Create" />
          <Settings
            state={state}
            actions={actions}
            header="Settings" />
          <View
            state={state}
            actions={actions}
            header="View" />
        </Panel>
      </ui>
    );
  }
}

window.setupUI = (el, state, actions) => render(<UI state={state} actions={actions} />, el, el.querySelector('ui'));