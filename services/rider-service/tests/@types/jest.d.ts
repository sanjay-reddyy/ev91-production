// Global Jest types for testing environment
import '@jest/types';

declare global {
  var describe: typeof import('@jest/globals').describe;
  var it: typeof import('@jest/globals').it;
  var test: typeof import('@jest/globals').test;
  var expect: typeof import('@jest/globals').expect;
  var beforeEach: typeof import('@jest/globals').beforeEach;
  var beforeAll: typeof import('@jest/globals').beforeAll;
  var afterEach: typeof import('@jest/globals').afterEach;
  var afterAll: typeof import('@jest/globals').afterAll;
  var jest: typeof import('@jest/globals').jest;
}
