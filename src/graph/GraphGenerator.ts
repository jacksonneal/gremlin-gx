import GremlinGxListener from '../../generated/parser/GremlinGxListener';
import { GraphConstraint } from './GraphConstraint';
import { FROM, TO } from './constants';
import { EqConstraint } from './constraints/PropertyConstraint';
import { Step } from './steps/Step';
import { VStep } from './steps/VStep';
import { OutStep } from './steps/OutStep';
import { HasStringObjectStep } from './steps/HasStringObjectStep';
import { measure, Metric, ScoredGraph } from './Metric';

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

  getGraph(): ScoredGraph {
    const graph = new GraphConstraint();

    for (let i = this.tree.length - 1; i >= 0; i--) {
      this.tree[i].passUpstream(graph);
    }

    // let completenessScore = measure(this.tree, graph, Metric.COMPLETENESS);
    // let reducedGraph = graph;
    // let didReduction = false;
    //
    // do {
    //   didReduction = false;
    //   const maybeGraph = reducedGraph.copy();
    //   const vArr = [...maybeGraph.vertices];
    //   vArr.sort((prev, next) => prev.properties.size - next.properties.size);
    //   for (let i = 0; i < vArr.length && !didReduction; i++) {
    //     for (let j = i + 1; j < vArr.length && !didReduction; j++) {
    //       const a = vArr[i];
    //       const b = vArr[j];
    //       if (a.canMerge(b) && !maybeGraph.edgeExists(a, b)) {
    //         maybeGraph.vertices.delete(a);
    //         maybeGraph.vertices.delete(b);
    //         const ab = a.merge(b);
    //         maybeGraph.vertices.add(ab);
    //         maybeGraph.edges.forEach((e) => {
    //           if (e.get(FROM)?.value() === a || e.get(FROM)?.value() === b) {
    //             e.trySet(FROM, new EqConstraint(ab));
    //           }
    //           if (e.get(TO)?.value() === a || e.get(TO)?.value() === b) {
    //             e.trySet(TO, new EqConstraint(ab));
    //           }
    //         });
    //         const maybeCompletenessScore = measure(this.tree, maybeGraph, Metric.COMPLETENESS);
    //         if (maybeCompletenessScore >= completenessScore) {
    //           completenessScore = maybeCompletenessScore;
    //           reducedGraph = maybeGraph;
    //           didReduction = true;
    //         }
    //       }
    //     }
    //   }
    // } while (didReduction);

    let building: ScoredGraph = {
      graph: new GraphConstraint(),
      completeness: 0,
      minimality: 0,
      addedElement: null
    };
    let elements = graph.elements();

    console.log('Before merge: ', graph.elements());

    while (building.completeness < 1.0 && elements.length > 0) {
      const candidates: ScoredGraph[] = [];
      for (let i = 0; i < elements.length; i++) {
        if (building.graph.canAccept(elements[i])) {
          const maybeGraph = building.graph.copy();
          maybeGraph.accept(elements[i]);
          const maybeCompleteness = measure(this.tree, maybeGraph, Metric.COMPLETENESS);
          const maybeMinimality = measure(this.tree, maybeGraph, Metric.MINIMALITY);
          candidates.push({
            graph: maybeGraph,
            completeness: maybeCompleteness,
            minimality: maybeMinimality,
            addedElement: elements[i]
          });
        } else {
          console.log('couldnt accept', elements[i]);
        }
      }
      if (candidates.length === 0) {
        break;
      }
      candidates.sort((prev, next) =>
        prev.completeness == next.completeness
          ? next.minimality - prev.minimality
          : next.completeness - prev.completeness
      );
      building = candidates[0];
      elements = elements.filter((e) => e !== building.addedElement);

      console.log('BUILDING', building);
    }

    console.log('final building', building.graph);

    return building;
  }
}
