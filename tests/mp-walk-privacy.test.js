const assert = require('assert');
const fs = require('fs');
const path = require('path');

function makeFakeCommand() {
  return {
    gte: () => ({ and: () => ({}) }),
    gt: () => ({}),
    lt: () => ({}),
    lte: () => ({}),
    inc: () => ({})
  };
}

function loadWalkHelpers() {
  const file = path.join(__dirname, '..', 'cloudfunctions', 'mp-walk', 'index.js');
  const source = fs.readFileSync(file, 'utf8');
  const helperSource = source.slice(0, source.indexOf('exports.main ='));
  const fakeCommand = makeFakeCommand();
  const fakeCloud = {
    init: () => {},
    DYNAMIC_CURRENT_ENV: 'test',
    database: () => ({ command: fakeCommand })
  };
  const fakeRequire = (name) => {
    if (name === 'wx-server-sdk') return fakeCloud;
    return require(name);
  };
  return new Function(
    'require',
    'exports',
    helperSource + '\nreturn { buildWalkGroups, buildBounds, distanceMeters };'
  )(fakeRequire, {});
}

function makeCollection(data) {
  return {
    where() { return this; },
    limit() { return this; },
    orderBy() { return this; },
    async get() { return { data }; },
    doc(id) {
      return {
        async remove() {
          return { removed: id };
        }
      };
    }
  };
}

function loadWalkMain({ openid, user, activeWalks, history }) {
  const file = path.join(__dirname, '..', 'cloudfunctions', 'mp-walk', 'index.js');
  const source = fs.readFileSync(file, 'utf8');
  const moduleExports = {};
  const fakeCommand = makeFakeCommand();
  const fakeDb = {
    command: fakeCommand,
    collection(name) {
      if (name === 'common_user') return makeCollection(user ? [user] : []);
      if (name === 'mp_active_walk') return makeCollection(activeWalks);
      if (name === 'mp_walk_history') return makeCollection(history);
      return makeCollection([]);
    }
  };
  const fakeCloud = {
    init: () => {},
    DYNAMIC_CURRENT_ENV: 'test',
    database: () => fakeDb,
    getWXContext: () => ({ OPENID: openid })
  };
  const fakeRequire = (name) => {
    if (name === 'wx-server-sdk') return fakeCloud;
    return require(name);
  };
  new Function('require', 'exports', source)(fakeRequire, moduleExports);
  return moduleExports.main;
}

const { buildWalkGroups, buildBounds, distanceMeters } = loadWalkHelpers();

const center = { latitude: 32.06, longitude: 118.79 };
const bounds = buildBounds(center.latitude, center.longitude, 1000);

assert(bounds.latMin < center.latitude && bounds.latMax > center.latitude);
assert(bounds.lngMin < center.longitude && bounds.lngMax > center.longitude);

const nearDistance = distanceMeters(center.latitude, center.longitude, 32.061, 118.791);
const farDistance = distanceMeters(center.latitude, center.longitude, 32.08, 118.82);
assert(nearDistance < 1000, 'near walker should be inside 1km');
assert(farDistance > 1000, 'far walker should be outside 1km');

const groups = buildWalkGroups([
  {
    latitude: 32.0601,
    longitude: 118.7901,
    pet_avatar_url: '',
    pet_name: 'hidden',
    user_id: 'hidden-user',
    openid: 'hidden-openid'
  },
  {
    latitude: 32.0602,
    longitude: 118.7902,
    pet_avatar_url: 'cloud://avatar-a',
    pet_name: 'hidden2',
    user_id: 'hidden-user2',
    openid: 'hidden-openid2'
  }
]);

assert.strictEqual(groups.length, 1);
assert.strictEqual(groups[0].count, 2);
assert.strictEqual(groups[0].pets.length, 2, 'group panel needs one avatar-only pet entry per walker');
assert.deepStrictEqual(
  groups[0].pets.map((pet) => Object.keys(pet)),
  [['avatarUrl'], ['avatarUrl']],
  'pet entries must only expose avatarUrl'
);
assert(!JSON.stringify(groups).includes('pet_name'));
assert(!JSON.stringify(groups).includes('hidden-user'));

(async () => {
  const main = loadWalkMain({
    openid: 'openid-a',
    user: { _id: 'user-a', openid: 'openid-a' },
    activeWalks: [
      {
        _id: 'self-session',
        user_id: 'user-a',
        latitude: 32.0601,
        longitude: 118.7901,
        pet_avatar_url: 'cloud://self'
      },
      {
        _id: 'other-session',
        user_id: 'user-b',
        latitude: 32.0602,
        longitude: 118.7902,
        pet_avatar_url: 'cloud://other',
        pet_name: 'hidden-other',
        openid: 'hidden-openid'
      }
    ],
    history: []
  });
  const res = await main({
    action: 'query',
    latitude: center.latitude,
    longitude: center.longitude,
    radius: 1000
  }, {});

  assert.strictEqual(res.code, 1);
  assert.strictEqual(res.data.groups.length, 1);
  assert.strictEqual(res.data.groups[0].count, 1, 'current user should not be counted as a nearby walker');
  assert.deepStrictEqual(res.data.groups[0].avatars, ['cloud://other']);
  assert(!JSON.stringify(res.data.groups).includes('cloud://self'));
  assert(!JSON.stringify(res.data.groups).includes('hidden-other'));
  assert(!JSON.stringify(res.data.groups).includes('hidden-openid'));

  console.log('mp-walk privacy helpers ok');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
