/* eslint-disable no-unused-expressions */

import sinon from 'sinon';

import { compose, map, toIdMap, values } from 'ladda-fp';
import { build } from 'ladda-cache';
import { logger } from '.';

const delay = (t = 1) => new Promise(res => setTimeout(() => res(), t));
const toMiniUser = ({ id, name }) => ({ id, name });

const createUserApi = (container) => {
  const getUser = (id) => Promise.resolve(container[id]);
  getUser.operation = 'READ';
  getUser.byId = true;
  const getUsers = () => Promise.resolve(values(container));
  getUsers.operation = 'READ';

  const updateUser = (nextUser) => {
    const { id } = nextUser;
    const user = container[id];
    container[id] = { ...user, ...nextUser };
    return Promise.resolve(container[id]);
  };
  updateUser.operation = 'UPDATE';

  const createUser = (user) => {
    container[user.id] = user;
    return Promise.resolve(user);
  };
  createUser.operation = 'CREATE';

  const removeUser = (id) => {
    delete container[id];
    return Promise.resolve();
  };
  removeUser.operation = 'DELETE';

  return { getUser, getUsers, createUser, updateUser, removeUser };
};

const createConfig = () => {
  const peter = { id: 'peter', name: 'peter', location: 'gothenburg' };
  const gernot = { id: 'gernot', name: 'gernot', location: 'graz' };
  const robin = { id: 'robin', name: 'robin', location: 'berlin' };

  const list = [peter, gernot, robin];
  const users = toIdMap(list);
  const miniUsers = compose(toIdMap, map(toMiniUser))(list);

  const getActivities = () => Promise.resolve([]);
  getActivities.operation = 'READ';

  return {
    user: {
      api: createUserApi(users),
      invalidates: ['activity']
    },
    miniUsers: {
      api: createUserApi(miniUsers),
      viewOf: 'user',
      invalidates: ['activity']
    },
    activity: {
      api: { getActivities }
    }
  };
};

const createMockLogger = () => ({
  log: sinon.spy(),
  info: sinon.spy(),
  warn: sinon.spy(),
  error: sinon.spy(),
  debug: sinon.spy()
});

describe('Ladda logger', () => {
  it('logs on startup', () => {
    const l = createMockLogger();
    build(createConfig(), [logger({ implementation: l })]);
    expect(l.log).to.have.been.called;
  });
});

