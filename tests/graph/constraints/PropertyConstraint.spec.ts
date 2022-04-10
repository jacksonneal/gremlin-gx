import { EqConstraint, NeqConstraint, WithoutConstraint } from '../../../src/graph/constraints/PropertyConstraint';

describe('value', () => {
  const obj = {};
  const arr = [];
  test.each([[1], [true], ['x'], [obj], [arr]])(`value %s`, (x) => {
    expect(new EqConstraint(x).value()).toBe(x);
    expect(new NeqConstraint(x).value()).not.toBe(x);
    expect([x]).not.toContain(new WithoutConstraint([x]).value());
  });
});

describe('canMerge', () => {
  const obj = {};
  const arr = [];

  // test.each([
  //   [1, 1, true],
  //   [1, 2, false],
  //   ['x', 'x', true],
  //   ['x', 'y', false],
  //   [true, true, true],
  //   [true, false, false],
  //   [obj, obj, true],
  //   [{}, {}, false],
  //   [arr, arr, true],
  //   [[], [], false],
  //   ['1', 1, false]
  // ])(`SamePass %s, %s, %s`, (x, y, res) => {
  //   expect(new EqConstraint(x).canMerge(new EqConstraint(y))).toBe(res);
  // });

  // test.each([
  //   [1, 1, false],
  //   [1, 2, true],
  //   ['x', 'x', false],
  //   ['x', 'y', true],
  //   [true, true, false],
  //   [true, false, true],
  //   [obj, obj, false],
  //   [{}, {}, true],
  //   [arr, arr, false],
  //   [[], [], true],
  //   ['1', 1, true]
  // ])(`DiffPass %s, %s, %s`, (x, y, res) => {
  //   expect(new EqConstraint(x).canMerge(new NeqConstraint(y))).toBe(res);
  //   expect(new NeqConstraint(x).canMerge(new EqConstraint(y))).toBe(res);
  //   expect(new EqConstraint(x).canMerge(new WithoutConstraint([y]))).toBe(res);
  //   expect(new WithoutConstraint([x]).canMerge(new EqConstraint(y))).toBe(res);
  // });

  // test.each([
  //   [1, 1, true],
  //   [1, 2, true],
  //   ['x', 'x', true],
  //   ['x', 'y', true],
  //   [true, true, true],
  //   [true, false, true],
  //   [obj, obj, true],
  //   [{}, {}, true],
  //   [arr, arr, true],
  //   [[], [], true],
  //   ['1', 1, true]
  // ])(`AllPass %s, %s, %s`, (x, y, res) => {
  //   expect(new NeqConstraint(x).canMerge(new NeqConstraint(y))).toBe(res);
  //   expect(new NeqConstraint(x).canMerge(new WithoutConstraint([y]))).toBe(res);
  //   expect(new WithoutConstraint([x]).canMerge(new NeqConstraint(y))).toBe(res);
  //   expect(new WithoutConstraint([x]).canMerge(new WithoutConstraint([y]))).toBe(res);
  // });
});

describe('merge', () => {
  const obj = {};
  const arr = [];

  test.each([[1], ['x'], [true], [obj], [arr]])(`EqMerge %s`, (x) => {
    expect(new EqConstraint(x).merge(new EqConstraint(x)).value()).toBe(x);
    expect(new EqConstraint(x).merge(new NeqConstraint(!x)).value()).toBe(x);
    expect(new NeqConstraint(!x).merge(new EqConstraint(x)).value()).toBe(x);
    expect(new EqConstraint(x).merge(new WithoutConstraint([!x])).value()).toBe(x);
    expect(new WithoutConstraint([!x]).merge(new EqConstraint(x)).value()).toBe(x);
    expect(new NeqConstraint(x).merge(new NeqConstraint(x)).value()).toBe(new WithoutConstraint([x]).value());
    expect(new NeqConstraint(x).merge(new WithoutConstraint([x])).value()).toBe(new WithoutConstraint([x]).value());
    expect(new WithoutConstraint([x]).merge(new NeqConstraint(x)).value()).toBe(new WithoutConstraint([x]).value());
    expect(new WithoutConstraint([x]).merge(new WithoutConstraint([x])).value()).toBe(
      new WithoutConstraint([x]).value()
    );
  });
});
