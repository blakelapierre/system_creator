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
      <controls>
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
      </controls>
    );

    function rgbToHex(c) {
      const hex = c.toString(16);
      return (hex.length == 1 ? '0' : '') + hex;
    }
  }
}

class Controls extends Component {
  render({state, actions}) {
    return (
      <save>
        <button onClick={actions['restart']}>Restart</button>
        <button onClick={() => console.log(state.eventLog)}>Save System</button>
      </save>
    );
  }
}

class UI extends Component {
  render({state, actions}) {
    return (
      <ui>
        <Controls state={state} actions={actions} />
        <Create state={state} actions={actions} />
      </ui>
    );
  }
}

window.setupUI = (el, state, actions) => render(<UI state={state} actions={actions} />, el);

        // <!-- <position>
        //   <label>Position: </label>
        //   <input type="number" value="0" />
        //   <input type="number" value="20" />
        //   <input type="number" value="0" />
        // </position>
        // <velocity>
        //   <label>Velocity: </label>
        //   <input type="number" value="-20" />
        //   <input type="number" value="0" />
        //   <input type="number" value="0" />
        // </velocity>
        // <mass>
        //   <label>Mass: </label>
        //   <input type="number" min="0" value="1" />
        // </mass>
        // <color>
        //   <label>Color: </label>
        //   <input type="color" />
        // </color> -->

// render(<Controls />, document.getElementsByTagName('ui')[0]);