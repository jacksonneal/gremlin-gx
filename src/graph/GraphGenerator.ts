import GremlinGxListener from '../../generated/parser/GremlinGxListener';
import { ElementConstraint } from './constraints/ElementConstraint';
import { GraphConstraint } from './GraphConstraint';
import { FROM, TO } from './constants';
import { EqConstraint } from './constraints/PropertyConstraint';
import { Step } from './steps/Step';
import { VStep } from './steps/VStep';
import { OutStep } from './steps/OutStep';
import { HasStringObjectStep } from './steps/HasStringObjectStep';

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
