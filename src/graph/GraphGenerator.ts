import GremlinGxListener from '../../generated/parser/GremlinGxListener';
import {
  EdgeConstraint,
  ElementConstraint,
  ElementType,
  StructConstraint,
  VertexConstraint
} from './ElementConstraint';
import { GraphConstraint } from './GraphConstraint';
import { FROM, ID, LABEL, TO } from './constants';
import { EqConstraint, NeqConstraint } from './PropertyConstraint';

export default class GraphGenerator extends GremlinGxListener {
  private tree: Step[];

  constructor() {
    super();
    this.tree = [];
  }

  exitTraversalSourceSpawnMethod_V(ctx) {
    super.exitTraversalSourceSpawnMethod_V(ctx);
    const genericLiteralExpr = ctx.genericLiteralList().genericLiteralExpr();
    if (genericLiteralExpr) {
      const ids: string[] = genericLiteralExpr.genericLiteral().map((gl) => gl.getText().slice(1, -1));
      this.tree.push(new VStep(new Set(ids)));
    } else {
      this.tree.push(new VStep(new Set()));
    }
  }

  exitTraversalMethod_out(ctx) {
    super.exitTraversalMethod_out(ctx);
    const stringLiteralExpr = ctx.stringLiteralList().stringLiteralExpr();
    if (stringLiteralExpr) {
      const labels: string[] = stringLiteralExpr.stringLiteral().map((sl) => sl.getText().slice(1, -1));
      this.tree.push(new OutStep(new Set(labels)));
    } else {
      this.tree.push(new OutStep(new Set()));
    }
  }

  exitTraversalMethod_has_String_Object(ctx) {
    super.exitTraversalMethod_has_String_Object(ctx);
    const key = ctx.stringLiteral().getText().slice(1, -1);
    const value = ctx.genericLiteral().getText().slice(1, -1);
    this.tree.push(new HasStringObjectStep(key, value));
  }

  getGraph(): Set<ElementConstraint> {
    const graph = new GraphConstraint();

    for (let i = this.tree.length - 1; i >= 0; i--) {
      this.tree[i].passUpstream(graph);
    }

    const completeness = (graph: GraphConstraint): number => {
      let total = 0;
      for (let i = 0; i < this.tree.length; i++) {
        total += this.tree[i].passDownstreamCompleteness(graph);
      }
      return total / this.tree.length;
    };

    let completenessScore = completeness(graph);
    let reducedGraph = graph;
    let didReduction = false;

    do {
      didReduction = false;
      const maybeGraph = reducedGraph.copy();
      const vArr = [...maybeGraph.vertices];
      vArr.sort((prev, next) => prev.properties.size - next.properties.size);
      for (let i = 0; i < vArr.length && !didReduction; i++) {
        for (let j = i + 1; j < vArr.length && !didReduction; j++) {
          const a = vArr[i];
          const b = vArr[j];
          if (a.canMerge(b) && !maybeGraph.edgeExists(a, b)) {
            maybeGraph.vertices.delete(a);
            maybeGraph.vertices.delete(b);
            const ab = a.merge(b);
            maybeGraph.vertices.add(ab);
            maybeGraph.edges.forEach((e) => {
              if (e.get(FROM)?.value() === a || e.get(FROM)?.value() === b) {
                e.trySet(FROM, new EqConstraint(ab));
              }
              if (e.get(TO)?.value() === a || e.get(TO)?.value() === b) {
                e.trySet(TO, new EqConstraint(ab));
              }
            });
            const maybeCompletenessScore = completeness(maybeGraph);
            if (maybeCompletenessScore >= completenessScore) {
              completenessScore = maybeCompletenessScore;
              reducedGraph = maybeGraph;
              didReduction = true;
            }
          }
        }
      }
    } while (didReduction);

    const allElements = Array.from(reducedGraph.vertices).concat(...reducedGraph.edges);
    return new Set(allElements);
  }
}

export interface Step {
  passUpstream(graph: GraphConstraint);

  passDownstreamCompleteness(graph: GraphConstraint): number;
}

class VStep implements Step {
  private readonly ids: Set<string>;

  constructor(ids: Set<string>) {
    this.ids = ids;
  }

  passUpstream(graph: GraphConstraint) {
    if (graph.head.size === 0) {
      graph.head.add(new VertexConstraint());
    }

    const idsToUse = [...this.ids];

    graph.head.forEach((h) => {
      h.type = ElementType.VERTEX;

      if (idsToUse.length) {
        h.trySet(ID, new EqConstraint(idsToUse.pop()));
      }

      graph.vertices.add(h);
    });

    idsToUse.forEach((id) => {
      const v = new VertexConstraint();
      v.trySet(ID, new EqConstraint(id));
      graph.head.add(v);
      graph.vertices.add(v);
    });
  }

  passDownstreamCompleteness(graph: GraphConstraint): number {
    graph.head = new Set([...graph.vertices]);
    if (this.ids.size > 0) {
      const headIds = [...graph.head].map((h) => h.get(ID)?.value());
      let included = 0;
      this.ids.forEach((id) => {
        if (headIds.includes(id)) {
          included++;
        }
      });
      return included / this.ids.size;
    } else {
      return Math.min(graph.head.size, 1);
    }
  }
}

class OutStep implements Step {
  private readonly labels: Set<string>;

  constructor(labels: Set<string>) {
    this.labels = labels;
  }

  passUpstream(graph: GraphConstraint): void {
    if (graph.head.size === 0) {
      graph.head.add(new VertexConstraint());
    }

    const labelsToUse = [...this.labels];

    const nextHead: Set<ElementConstraint> = new Set();

    graph.head.forEach((h) => {
      h.type = ElementType.VERTEX;

      const from = new VertexConstraint();
      const edge = new EdgeConstraint();
      edge.trySet(FROM, new EqConstraint(from));
      edge.trySet(TO, new EqConstraint(h));

      if (labelsToUse.length > 0) {
        edge.trySet(LABEL, new EqConstraint(labelsToUse.pop()));
      }

      graph.vertices.add(h);
      graph.vertices.add(from);
      graph.edges.add(edge);
      nextHead.add(from);
    });

    labelsToUse.forEach((label) => {
      const from = new VertexConstraint();
      const edge = new EdgeConstraint();
      edge.trySet(FROM, new EqConstraint(from));
      edge.trySet(TO, new EqConstraint(graph.vertices.values().next()));
      edge.trySet(LABEL, new EqConstraint(label));

      graph.vertices.add(from);
      graph.edges.add(edge);
      nextHead.add(from);
    });

    graph.head = nextHead;
  }

  passDownstreamCompleteness(graph: GraphConstraint): number {
    const nextHead = new Set<ElementConstraint>();
    graph.head.forEach((h) => {
      graph.edges.forEach((e) => {
        if (e.get(FROM)?.value() === h && (this.labels.size === 0 || this.labels.has(e.get(LABEL)?.value()))) {
          nextHead.add(e.get(TO)?.value());
        }
      });
    });

    graph.head = nextHead;

    const numShouldHave = Math.max(this.labels.size, 1);
    return Math.min(1, graph.head.size / numShouldHave);
  }
}

class HasStringObjectStep implements Step {
  private readonly key: string;
  private readonly value: any;

  constructor(key: string, value: any) {
    this.key = key;
    this.value = value;
  }

  passUpstream(graph: GraphConstraint): void {
    if (graph.head.size === 0) {
      graph.head.add(new StructConstraint());
    }

    graph.head.forEach((h) => {
      h.trySet(this.key, new EqConstraint(this.value));
    });

    const failElement = new StructConstraint();
    failElement.trySet(this.key, new NeqConstraint(this.value));
    graph.head.add(failElement);
  }

  passDownstreamCompleteness(graph: GraphConstraint): number {
    const nextHead = new Set<ElementConstraint>();
    let pass = false;
    let fail = false;
    graph.head.forEach((h) => {
      if (h.get(this.key)?.value() === this.value) {
        pass = true;
        nextHead.add(h);
      } else if (h.get(this.key)?.value() !== this.value) {
        fail = true;
      }
    });
    graph.head = nextHead;

    let ret = 0;
    if (pass) {
      ret++;
    }
    if (fail) {
      ret++;
    }
    return ret / 2;
  }
}
