/* eslint-disable @typescript-eslint/no-unused-expressions */

import sinon from 'sinon';
import {curry} from 'ladda-fp';
import {decorateNoOperation} from './no-operation';
import * as Cache from '../cache';
import {createSampleConfig, createApiFunction} from '../test-helper';

const curryNoop = () => () => {};

const config = createSampleConfig();

describe('DecorateNoOperation', () => {
  it('Invalidates based on what is specified in the original function', () => {
    const cache = Cache.createCache(config);
    const e = config[0];
    const xOrg = {__ladda__id: 1, name: 'Kalle'};
    const aFn = sinon.spy(() => Promise.resolve({}));
    const getUsers = () => Promise.resolve(xOrg);
    getUsers.fnName = 'getUsers';
    aFn.invalidates = ['getUsers'];
    Cache.storeQueryResponse(cache, e, getUsers, ['args'], xOrg);
    const res = decorateNoOperation({}, cache, curryNoop, e, aFn);
    return res(xOrg).then(() => {
      const killedCache = !Cache.containsQueryResponse(cache, e, getUsers, ['args']);
      expect(killedCache).to.be.true;
    });
  });

  it('Does not change original function', () => {
    const cache = Cache.createCache(config);
    const e = config[0];
    const aFn = sinon.spy(() => {
      return Promise.resolve({});
    });
    decorateNoOperation({}, cache, curryNoop, e, aFn);
    expect(aFn.operation).to.be.undefined;
  });

  it('Ignored inherited invalidation config', () => {
    const cache = Cache.createCache(config);
    const e = config[0];
    const xOrg = {__ladda__id: 1, name: 'Kalle'};
    const aFnWithoutSpy = createApiFunction(() => Promise.resolve({}), {invalidates: ['user']});
    const aFn = sinon.spy(aFnWithoutSpy);
    const getUsers = createApiFunction(() => Promise.resolve(xOrg));
    aFn.hasOwnProperty = () => false;
    Cache.storeQueryResponse(cache, e, getUsers, ['args'], xOrg);
    const res = decorateNoOperation({}, cache, curryNoop, e, aFn);
    return res(xOrg).then(() => {
      const killedCache = !Cache.containsQueryResponse(cache, e, getUsers, ['args']);
      expect(killedCache).to.be.false;
    });
  });

  it('trigger notification', () => {
    const spy = sinon.spy();
    const n = curry((a, b) => spy(a, b));
    const cache = Cache.createCache(config);
    const e = config[0];
    const xOrg = {__ladda__id: 1, name: 'Kalle'};
    const aFn = sinon.spy(() => Promise.resolve({}));
    const getUsers = () => Promise.resolve(xOrg);
    aFn.invalidates = ['getUsers'];
    Cache.storeQueryResponse(cache, e, getUsers, ['args'], xOrg);
    const res = decorateNoOperation({}, cache, n, e, aFn);
    return res(xOrg).then(() => {
      expect(spy).to.have.been.calledOnce;
      expect(spy).to.have.been.calledWith([xOrg], null);
    });
  });
});
