window.createSim = function() {
  return createUniverse([new Mass(1000000, [255, 255, 0, 255])]);
};

window.createRunner = function runner(state, clock = new Clock(state.ticksPerStep), maxRunTime = 1000 / 30, GUIUpdateRate = 100) {
  const {startTime} = clock,
        {events} = state;

  let currentTick = 0,
      lastGUIUpdate = 0,
      currentTime;

  return (runTime = clock.currentTime) => {
    const t = clock.ticksTo(runTime);

    while (currentTick < t && ((currentTime = clock.currentTime) - runTime) < maxRunTime) {
      handleEvents(state);
      tick(state);
      currentTick++;
    }

    centerOn(state.universe[0], state.universe);
  };

  function handleEvents(state) {
    const {eventLog, events} = state;
    if (events.length === 0) return;

    eventLog.push([currentTick, events.slice()]);

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      (eevents[event[0]] || defaultHandler(event))(event, state);
    }

    events.splice(0);
  }

  function defaultHandler(event) {
    console.log(`No eevents ${event[0]}!`)
    return emptyFn;
  }

  function emptyFn() {}
};

function createUniverse(existingMasses) {
  const universe = [...existingMasses],
        events = [],
        uievents = [];

  const [
    positions,
    velocities,
    accelerations,
    gravities,
    masses,
    sizes,
    colors
  ] = map(universe, ['position', 'velocity', 'acceleration', 'gravity', 'mass', 'size', 'color']);

  function map(list, properties) {
    return properties.map(p => list.map(item => item[p]));
  }

  return {universe, events, eevents, uievents, uuievents, positions, velocities, accelerations, gravities, masses, sizes, colors, currentTick: 0, collisionList: [], tick, ticksPerStep: 60, stepsPerSecond: 1, gravityConstant: 6.67408e-7, eventLog: []};
}

function addMass(newMass, {universe, positions, velocities, accelerations, gravities, masses, sizes, colors, uievents, currentTick}) {
  const {position, velocity, acceleration, gravity, mass, size, color} = newMass;

  newMass.created = currentTick;

  universe.push(newMass);
  positions.push(position);
  velocities.push(velocity);
  accelerations.push(acceleration);
  gravities.push(gravity);
  masses.push(mass);
  sizes.push(size);
  colors.push(color);

  uievents.push(['newmass']);

  console.log(sizes);

  return newMass;
}

function newMass([_, {position: p, velocity: v, mass, color}], state) {
  console.log('newmass', p, v, mass, color);
  const {position: tp, velocity: tv} = state.universe[0] || {position: [0, 0, 0], velocity: [0, 0, 0]};
  const newMass = addMass(new Mass(mass, color.slice(), [tp[0] + p[0], tp[1] + p[1], tp[2] + p[2]], [tv[0] + v[0], tv[1] + v[1], tv[2] + v[2]]), state);

  setStat('masses', state.universe.length);
}


function absorbed(event, {uievents}) {
  uievents.push(event);
}

function poof([_, mass]) {
  if (mass instanceof TweetSpawn) {
    tweetSpawn.splice(tweetSpawn.indexOf(mass), 1);
  }
  else if (mass instanceof Tweet) {
    tweets.splice(tweets.indexOf(mass), 1);
    delete tweetMap[mass.tweetID];
  }
  else if (mass instanceof Observer) {
    observers.splice(observers.indexOf(mass), 1);
  }

  const index = universe.indexOf(mass); // annoying lookup
  console.log('poof removing', index);
  universe.splice(index, 1);
  positions.splice(index, 1);
  velocities.splice(index, 1);
  accelerations.splice(index, 1);
  gravities.splice(index, 1);
  masses.splice(index, 1);
  sizes.splice(index, 1);
  colors.splice(index, 1);
}

function tick(state) {
  state.currentTick++;

  positionHalfTick(state);
  updateGravities(state);
  updateVelocities(state);
  resolveCollisions(state);

  function positionHalfTick({universe, ticksPerStep}) {
    for (let i = 0; i < universe.length; i++) {
      const mass = universe[i];

      mass.positionHalfTick(ticksPerStep);
      set(mass.gravity, 0, 0, 0);
    }
  }

  function updateGravities({universe, collisionList, ticksPerStep, gravityConstant}) {
    for (let i = 0; i < universe.length; i++) updatePairs(i, universe, collisionList, ticksPerStep, gravityConstant);
  }

  function updatePairs(i, universe, collisionList, ticksPerStep, gravityConstant) {
    const {
      position: p1,
      velocity: v1,
      acceleration: a1,
      gravity: g1,
      mass: m1,
      collisionSize: s1,
      collisions
    } = universe[i];

    for (let j = i + 1; j < universe.length; j++) updatePair(p1, v1, a1, g1, m1, s1, i, j, collisions, collisionList, universe, ticksPerStep, gravityConstant); //

    if (collisions.length > 0) {
      collisionList.push(collisions[0]);
      if (collisions.length > 1) console.log('+1', collisions);
      collisions.splice(0);
    }

    // F = ma ... a = F/m
    div(g1, g1, m1);
  }

  function updatePair(p1, v1, a1, g1, m1, s1, i, j, collisions, collisionList, universe, ticksPerStep, gravityConstant) {
    const {
      position: p2,
      velocity: v2,
      acceleration: a2,
      mass: m2,
      collisionSize: s2,
      gravity: g2
    } = universe[j];

    sub(dd, p1, p2);

    const distance = magnitude(dd),
          t = -distance / (speedlimit * speedlimit),
          o = t / ticksPerStep;

    updatePositionAndGravity(o, a1, a2, v1, v2, p1, p2, g1, g2, m1 * m2, gravityConstant);

    handleCollision(s1, s2, m1, m2, distance, i, j, collisionList, collisions, universe);
  }

  function updatePositionAndGravity(o, a1, a2, v1, v2, p1, p2, g1, g2, m, gravityConstant) {
    updatePosition(oldp1, o, a1, v1, p1);
    updatePosition(oldp2, o, a2, v2, p2);

    sub(pv1, oldp1, p2);
    sub(pv2, oldp2, p1);

    const d1 = dot(pv1, pv1),
          d2 = dot(pv2, pv2);

    updateGravity(d1, pv1, g2, m, gravityConstant);
    updateGravity(d2, pv2, g1, m, gravityConstant);
  }

  function updatePosition(oldp, o, a, v, p) {
    return add(oldp, p, scale(dd, add(dd, v, scale(dd, add(dd, v, scale(dd, a, o)), 0.5)), o));
  }

  function updateGravity(d, pv, g, m, gravityConstant) {
    if (d > 0) add(g, g, scale(dd, pv, gravityConstant * m / d));
  }

  function handleCollision(s1, s2, m1, m2, distance, i, j, collisionList, collisions, universe) {
    if (collisions.length === 0) {
      const threshold = (s1 + s2) / 150;
      if (distance < threshold) { // better ordering of checks?
        console.log(distance, threshold, s1, s2);
        if (m1 <= m2) {
          //wtf is this
          collisions.push([universe[i], universe[j], i, j]);
        }
        else {
          universe[j].collisions.push([universe[j], universe[i], j, i]);
        }
      }
    }
  }

  function updateVelocities({universe, ticksPerStep}) {
    universe.forEach(mass => updateMassVelocityAndPartialPosition(mass, ticksPerStep));
  }

  function updateMassVelocityAndPartialPosition(mass, ticksPerStep) {
    mass.velocityTick(ticksPerStep);
    mass.positionHalfTick(ticksPerStep);
  }

  function resolveCollisions({universe, positions, velocities, accelerations, gravities, masses, sizes, colors, events, collisionList}) {
    for (let i = collisionList.length - 1; i >= 0; i--) {
      const [smallerMass, greaterMass] = collisionList[i];

      greaterMass.mass += smallerMass.mass;

      const ratio = smallerMass.mass / greaterMass.mass; // 0?

      greaterMass.color[0] = (1 - ratio) * greaterMass.color[0] + ratio * smallerMass.color[0];
      greaterMass.color[1] = (1 - ratio) * greaterMass.color[1] + ratio * smallerMass.color[1];
      greaterMass.color[2] = (1 - ratio) * greaterMass.color[2] + ratio * smallerMass.color[2];

      div(greaterMass.velocity,
        add(greaterMass.velocity,
          scale(greaterMass.velocity,
            greaterMass.velocity,
            greaterMass.mass),
          scale(dd, smallerMass.velocity, smallerMass.mass)),
        greaterMass.mass + smallerMass.mass);
    }

    for (let i = collisionList.length - 1; i >= 0; i--) {
      const [smallerMass, greaterMass, smallerIndex, greaterIndex] = collisionList[i];

      incrementStat(smallerMass.constructor.name, 'absorbedBy', greaterMass.constructor.name);

      events.push(['absorbed', smallerMass.name, greaterMass.name]);

      sizes[greaterIndex] = greaterMass.size;

      universe.splice(smallerIndex, 1);
      positions.splice(smallerIndex, 1);
      velocities.splice(smallerIndex, 1);
      accelerations.splice(smallerIndex, 1);
      gravities.splice(smallerIndex, 1);
      masses.splice(smallerIndex, 1);
      sizes.splice(smallerIndex, 1);
      colors.splice(smallerIndex, 1);
    }

    collisionList.splice(0);
  }
}

function centerOn(mass, universe) {
  const {position: tp} = mass;
  for (let i = universe.length - 1; i >= 0; i--) {
    const {position: p} = universe[i];
    sub(p, p, tp);
  }
}

const eevents = {
  // external
  'newmass': newMass,

  // internal
  'absorbed': absorbed,
  'poof': poof
};

const uuievents = {
  // 'connected': () => noticeEl.classList.add('connected'),
  // 'tweet': event => trumpTweetEl.classList.remove('show'),
  // 'absorbed': event => absorbedEl.classList.remove('show'),
  // 'absorbedBy': event => absorbedByEl.classList.remove('show'),
  // 'poof': event => poofEl.classList.remove('show'),
  'newmass': (event, view, {positions, colors, sizes}) => {
    view.select('#positions').set('width', positions.length);
    view.select('#colors').set('width', colors.length);
    view.select('#sizes').set('width', sizes.length);
  },
  'log': ([log, ...args]) => console.log('log', ...args)
};

class Mass {
  constructor(mass, color, position = [0, 0, 0], velocity = [0, 0, 0], acceleration = [0, 0, 0], gravity = [0, 0, 0]) {
    this._sizeContainer = [];
    this.mass = mass;
    this.color = color;
    this.position = position;
    this.velocity = velocity;
    this.acceleration = acceleration;
    this.gravity = gravity;
    this.boost = [0, 0, 0];
    this.emissionCounter = 0;
    this.collisions = [];
  }

  set mass(value) { this._mass = value; this._sizeContainer[0] = Math.pow((3 / (4 * Math.PI)) * value, 1 / 3); }
  // set mass(value) { this._mass = value; this._sizeContainer[0] = 5 * Math.pow(value / Math.PI, 1 / 2); }
  get mass() { return this._mass; }

  get name() { return 'Mass'; }

  get size() { return this._sizeContainer[0]; }
  get collisionSize() { return this.size; }
  // get size() { return this.mass; }
  // get size() { return 800 * Math.log2(this.mass + 1); }

  positionHalfTick(ticksPerStep) {
    const {position: p, velocity: v} = this;
    add(p, p, div(dd, div(dd, v, ticksPerStep), 2));
  }

  velocityTick(ticksPerStep) {
    const {
      velocity: v,
      acceleration: a,
      gravity: g
    } = this;

    add(v, v, div(dd, add(dd, a, g), ticksPerStep));
  }
}

class Clock {
  constructor(ticksPerStep) {
    this.ticksPerStep = ticksPerStep;
    this.startTime = this.currentTime;
  }

  get currentTime() { return new Date().getTime(); }

  ticksTo(time) {
    const dt = time - this.startTime;
    return Math.floor((dt / 1000) * this.ticksPerStep);
  }
}

const stats = {totalSouls: 0};
function incrementStat(target, relation, object) {
  stats[target] = stats[target] || {};
  stats[target][relation] = stats[target][relation] || {};
  return (stats[target][relation][object] = (stats[target][relation][object] || 0) + 1);
}

function setStat(target, value) {
  stats[target] = value;
}

function newv (s) {
  return copy([0, 0, 0], s);
}

function set (r, x, y, z) {
  r[0] = x;
  r[1] = y;
  r[2] = z;
  return r;
}

function copy (r, s) {
  r[0] = s[0];
  r[1] = s[1];
  r[2] = s[2];
  return r;
}

function add (r, u, v) {
  r[0] = u[0] + v[0];
  r[1] = u[1] + v[1];
  r[2] = u[2] + v[2];
  return r;
}

function sub (r, u, v) {
  r[0] = u[0] - v[0];
  r[1] = u[1] - v[1];
  r[2] = u[2] - v[2];
  return r;
}

function scale (r, v, s) {
  r[0] = v[0] * s;
  r[1] = v[1] * s;
  r[2] = v[2] * s;
  return r;
}

function div (r, v, d) {
  if (d === 0) return copy(r, v);
  r[0] = v[0] / d;
  r[1] = v[1] / d;
  r[2] = v[2] / d;
  return r;
}

function cross (r, u, v) {
  r[0] = u[1] * v[2] - u[2] * v[1];
  r[1] = u[2] * v[0] - u[0] * v[2];
  r[2] = u[0] * v[1] - u[1] * v[0];
  return r;
}

function dot (u, v) {
  return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
}

function magnitude(v) {
  return Math.sqrt(v[0] * v[0] +
                   v[1] * v[1] +
                   v[2] * v[2]);
}

function normalize(r, v) {
  return div(r, v, magnitude(v));
}

// http://lolengine.net/blog/2013/09/18/beautiful-maths-quaternion-from-vectors
function qFromVectors(u, v) {
  cross(dd, u, v);
  const q = [dot(u, v), dd[0], dd[1], dd[2]];
  q[0] += qnorm(q);
  return qunit(q, q);
}

// http://web.archive.org/web/20161105145605/http://lolengine.net/blog/2014/02/24/quaternion-from-two-vectors-final
function qFromVectors2(u, v) {
  const n = Math.sqrt(dot(u, u) * dot(v, v)),
        r = n + dot(u, v);

  if (r < 1e-6) { // why this value?!
    console.log('small value', r);
    if (Math.abs(dd[0]) > Math.abs(dd[2])) return qunit(q, [0, -dd[1], dd[2], 0]);
    else return qunit(q, [0, 0, -dd[2], dd[1]]);
  }
  else {
    cross(dd, u, v);
    const q = [r, dd[0], dd[1], dd[2]];

    return qunit(q, q);
  }
}

function qFromUnitVectors2(u, v) {
  const r = 1 + dot(u, v);

  if (r < 1e-6) { // why this value?!
    console.log('small value', r);
    if (Math.abs(dd[0]) > Math.abs(dd[2])) return qunit(q, [0, -dd[1], dd[2], 0]);
    else return qunit(q, [0, 0, -dd[2], dd[1]]);
  }
  else {
    cross(dd, u, v);
    const q = [r, dd[0], dd[1], dd[2]];

    return qunit(q, q);
  }
}

function qFromVectors2(u, v) {
  cross(dd, u, v);
  const q = [1 + dot(u, v), dd[0], dd[1], dd[2]];
  return qunit(q, q);
}

// http://lolengine.net/blog/2013/09/18/beautiful-maths-quaternion-from-vectors
function qFromUnitVectors(u, v) {
  const m = Math.sqrt(2 + 2 * dot(u, v));
  div(dd, cross(dd, u, v), m);
  return [m/2, dd[0], dd[1], dd[2]];
}


//http://mathworld.wolfram.com/Quaternion.html
function qmult(r, q1, q2) {

  const v1 = [q1[1], q1[2], q1[3]],
        v2 = [q2[1], q2[2], q2[3]],
        s1 = scale([0, 0, 0], v2, q1[0]),
        s2 = scale([0, 0, 0], v1, q2[0]);

  add(dd, s1, add(dd, s2, cross(dd, v1, v2)));

  r[0] = q1[0] * q2[0] - dot(v1, v2);
  r[1] = dd[0];
  r[2] = dd[1];
  r[3] = dd[2];

  return r;
}

function qconj(r, q) {
  r[0] = q[0];
  r[1] = -q[1];
  r[2] = -q[2];
  r[3] = -q[3];

  return r;
}

// don't call with d = 0
function qdiv(r, q, d) {
  r[0] = q[0] / d;
  r[1] = q[1] / d;
  r[2] = q[2] / d;
  r[3] = q[3] / d;

  return r;
}

function qnorm(q) {
  return Math.sqrt(q[0] * q[0] +
                   q[1] * q[1] +
                   q[2] * q[2] +
                   q[3] * q[3]);
}

// assumes unit q?
// function qinv(r, q) {
//   const s = 1 / (q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);

//   r[0] = q[0] * s
//   r[1] = -q[1] * s
//   r[2] = -q[2] * s
//   r[3] = -q[3] * s

//   return r;
// }

function qinv(r, q) {
  const n = qnorm(q);
  return qdiv(r, qconj(r, q), n * n);
}

function qunit(r, q) {
  return qdiv(r, q, qnorm(q));
}

const speedlimit = 300000;
const pv1 = [0, 0, 0],
      pv2 = [0, 0, 0],
      oldp1 = [0, 0, 0],
      oldp2 = [0, 0, 0],
      dd = [0, 0, 0];