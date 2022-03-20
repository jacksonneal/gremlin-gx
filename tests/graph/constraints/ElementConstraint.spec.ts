import {
  EdgeConstraint,
  elementConstraintFactory,
  ElementType,
  VertexConstraint
} from '../../../src/graph/constraints/ElementConstraint';
import { LABEL } from '../../../src/graph/constants';
import { EqConstraint } from '../../../src/graph/constraints/PropertyConstraint';

describe('factory', () => {
  test.each([[ElementType.VERTEX], [ElementType.EDGE], [ElementType.UNKNOWN]])(`factory %s`, (type) => {
    expect(elementConstraintFactory(type).type).toBe(type);
  });
});

describe('element constraint', () => {
  test.each([
    [ElementType.EDGE, LABEL, 'UNIT'],
    [ElementType.VERTEX, 'height', 1],
    [ElementType.UNKNOWN, 'width', 2],
    [ElementType.VERTEX, 'country', 'USA'],
    [ElementType.VERTEX, 'isTest', true]
  ])(`get trySet copy %s %s %s`, (type, key, value) => {
    const ec = elementConstraintFactory(type);
    const pc = new EqConstraint(value);
    ec.trySet(key, pc);
    expect(ec.get(key)).toBe(pc);
    const copyEc = ec.copy();
    expect(ec).not.toBe(copyEc);
    expect(pc).toBe(copyEc.get(key));
  });

  test(`canMerge`, () => {
    const v0 = new VertexConstraint();
    const v1 = new VertexConstraint();
    const e = new EdgeConstraint();
    const pc0 = new EqConstraint(1);
    v0.trySet('key', pc0);
    v1.trySet('key', pc0);
    expect(v0.canMerge(e)).toBe(false);
    expect(v0.canMerge(v1)).toBe(true);
    expect(v0.canMerge(v1)).toBe(true);
    const pc1 = new EqConstraint(2);
    v1.trySet('key', pc1);
    expect(v0.canMerge(v1)).toBe(false);
  });

  test(`merge`, () => {
    const v0 = new VertexConstraint();
    const v1 = new VertexConstraint();
    const pc0 = new EqConstraint(1);
    const pc1 = new EqConstraint(2);
    const pc2 = new EqConstraint(3);
    v0.trySet('key', pc0);
    v1.trySet('key', pc0);
    v1.trySet('alt', pc1);
    v0.trySet('oth', pc2);
    const merged = v0.merge(v1);
    expect(merged.type).toBe(ElementType.VERTEX);
    expect(merged.get('key')?.value()).toBe(pc0.value());
    expect(merged.get('alt')?.value()).toBe(pc1.value());
    expect(merged.get('oth')?.value()).toBe(pc2.value());
  });
});
