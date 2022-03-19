import * as GraphParser from '../../src/graph/GraphParser';
import { EdgeConstraint, ElementType, VertexConstraint } from '../../src/graph/constraints/ElementConstraint';
import { FROM, ID, LABEL, TO } from '../../src/graph/constants';
import { EqConstraint } from '../../src/graph/constraints/PropertyConstraint';

describe('traversalSourceSpawnMethod_V', () => {
  test('g.V()', () => {
    const graph = GraphParser.parse('g.V()');
    const expected = new Set([new VertexConstraint()]);
    expect(graph).toStrictEqual(expected);
  });

  test('g.V(id)', () => {
    const id = 'id-0';
    const graph = GraphParser.parse(`g.V('${id}')`);
    const v = new VertexConstraint();
    v.trySet(ID, new EqConstraint(id));
    const expected = new Set([v]);
    expect(graph).toStrictEqual(expected);
  });

  test('g.V(ids)', () => {
    const id0 = 'id-0';
    const id1 = 'id-1';
    const id2 = 'null';
    const graph = GraphParser.parse(`g.V('${id0}', "${id1}", '${id2}')`);
    const v0 = new VertexConstraint();
    v0.trySet(ID, new EqConstraint(id0));
    const v1 = new VertexConstraint();
    v1.trySet(ID, new EqConstraint(id1));
    const v2 = new VertexConstraint();
    v2.trySet(ID, new EqConstraint(id2));
    const expected = new Set([v0, v1, v2]);
    expect(graph).toStrictEqual(expected);
  });
});

describe('traversalMethod_out', () => {
  test('g.V().out()', () => {
    const graph = GraphParser.parse('g.V().out()');
    const from = new VertexConstraint();
    const e = new EdgeConstraint();
    const to = new VertexConstraint();
    e.trySet(FROM, new EqConstraint(from));
    e.trySet(TO, new EqConstraint(to));
    const expected = new Set([from, e, to]);
    expect(graph).toStrictEqual(expected);
  });

  test('g.V().out(label)', () => {
    const label = 'knows';
    const graph = GraphParser.parse(`g.V().out('${label}')`);
    const from = new VertexConstraint();
    const e = new EdgeConstraint();
    const to = new VertexConstraint();
    e.trySet(LABEL, new EqConstraint(label));
    e.trySet(FROM, new EqConstraint(from));
    e.trySet(TO, new EqConstraint(to));
    const expected = new Set([from, e, to]);
    expect(graph).toStrictEqual(expected);
  });

  test('g.V().out(labels)', () => {
    const label0 = 'knows';
    const label1 = 'likes';
    const graph = GraphParser.parse(`g.V().out('${label0}', '${label1}')`);
    const elements = [...graph];
    const vCount = elements.filter((e) => e.type === ElementType.VERTEX).length;
    const eCount = elements.filter((e) => e.type === ElementType.EDGE).length;
    const labelCount0 = elements.filter((e) => e.get(LABEL)?.value() === label0).length;
    const labelCount1 = elements.filter((e) => e.get(LABEL)?.value() === label1).length;
    expect(vCount).toBe(2);
    expect(eCount).toBe(2);
    expect(labelCount0).toBe(1);
    expect(labelCount1).toBe(1);
  });
});

describe('traversalMethod_has', () => {
  test('g.V().has(key, val)', () => {
    const key = 'name';
    const value = 'sam';
    const graph = GraphParser.parse(`g.V().has('${key}', '${value}')`);
    const elements = [...graph];
    const vCount = elements.filter((e) => e.type === ElementType.VERTEX).length;
    const valCount = elements.filter((e) => e.get(key)?.value() === value).length;
    expect(vCount).toBe(2);
    expect(valCount).toBe(1);
  });

  test('g.V().out().has(key, val)', () => {
    const key = 'name';
    const value = 'sam';
    const graph = GraphParser.parse(`g.V().out().has('${key}', '${value}')`);
    const elements = [...graph];
    const vCount = elements.filter((e) => e.type === ElementType.VERTEX).length;
    const eCount = elements.filter((e) => e.type === ElementType.EDGE).length;
    const valCount = elements.filter((e) => e.get(key)?.value() === value).length;
    expect(vCount).toBe(3);
    expect(eCount).toBe(2);
    expect(valCount).toBe(1);
  });
});
