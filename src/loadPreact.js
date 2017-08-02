import { h, render, Component } from 'preact';

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
                <input class="mass" type="number" min="1" step="100" value={this.state.massBase} onChange={({target: {value}}) => this.setState({massBase: parseFloat(value, 10)})} />
                x 10 ^
                <input class="mass-exponent" type="number" min="0" step="1" value={this.state.massExponent} onChange={({target: {value}}) => this.setState({massExponent: parseFloat(value, 10)})} />
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

class Settings extends Component {
  constructor(props) {
    super(props);

    const {gravityConstant, ticksPerStep, stepsPerSecond, fieldOfView} = props.state;

    this.state = {
      gravityConstant,
      ticksPerStep,
      stepsPerSecond,
      fieldOfView
    };
  }

  render({state, actions}) {
    return (
      <settings>
        <table>
          <tbody>
            <tr>
              <td>Gravity Constant:</td>
              <td>
                <input
                  type="number"
                  value={this.state.gravityConstant}
                  step="0.00000001"
                  onInput={({target: {value}}) => this.setState({gravityConstant: parseFloat(value, 10)}) & actions['setGravityConstant'](parseFloat(value, 10))} />
              </td>
            </tr>
            <tr>
              <td>Ticks Per Step:</td>
              <td>
                <input
                  type="number"
                  value={this.state.ticksPerStep}
                  onInput={({target: {value}}) => this.setState({ticksPerStep: parseInt(value, 10) & actions['setTicksPerStep'](parseInt(value, 10))})} />
              </td>
            </tr>
            <tr>
              <td>Steps Per Second:</td>
              <td>
                <input
                  type="number"
                  value={this.state.stepsPerSecond}
                  onInput={({target: {value}}) => this.setState({stepsPerSecond: parseInt(value, 10)}) & actions['setStepsPerSecond'](parseInt(value, 10))} />
              </td>
            </tr>
            <tr>
              <td>Field Of View:</td>
              <td>
                <input
                  type="range"
                  min="1"
                  max="179"
                  value={this.state.fieldOfView}
                  onInput={({target: {value}}) => this.setState({fieldOfView: parseInt(value, 10)}) & actions['setFieldOfView'](parseInt(value, 10))} /> {this.state.fieldOfView} degrees
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
      <save>
        <button onClick={actions['restart']}>Restart</button>
        <button onClick={actions['save']}>Save System</button>
        <button onClick={() => this.setState({showLoad: !this.state.showLoad}) & actions['load']}>Load System</button>
        {this.state.showLoad ? <LoadControl state={state} actions={actions} /> : undefined}
      </save>
    );
  }
}

class LoadControl extends Component {
  render({state, actions}) {
    const systems = (JSON.parse(localStorage['systems'] || '[]')).map(([time, system]) => <system onClick={() => actions['load'](system)}>{new Date(time).toString()}</system>);
    return (
      <load>
        <span>Prior Systems</span>
        {systems}
      </load>
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
              onClick={() => this.setState({selected: (selected + 1) % children.length})}
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
            className={state ? 'selected' : ''}
            state={state}
            actions={actions}
            header="Settings" />
        </Panel>
      </ui>
    );
  }
}

window.setupUI = (el, state, actions) => render(<UI state={state} actions={actions} />, el, el.querySelector('ui'));