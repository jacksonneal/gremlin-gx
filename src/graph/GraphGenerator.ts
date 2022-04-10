import GremlinGxListener from '../../generated/parser/GremlinGxListener';
import { GraphConstraint } from './GraphConstraint';
import { Step } from './steps/Step';
import { VStep } from './steps/VStep';
import { OutStep } from './steps/OutStep';
import { HasStringObjectStep } from './steps/HasStringObjectStep';
import { measure, Metric, ScoredGraph } from './Metric';
import {resolveObjectURL} from "buffer";

export default class GraphGenerator extends GremlinGxListener {
  private readonly tree: Step[];

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

    let reduced: ScoredGraph = {
      graph: new GraphConstraint(),
      completeness: 0,
      minimality: 0,
      addedElement: null
    };
    let elements = graph.elements();

    while (reduced.completeness < 1.0 && elements.length > 0) {
      const candidates: ScoredGraph[] = [];
      for (let i = 0; i < elements.length; i++) {
        if (reduced.graph.canAccept(elements[i])) {
          const maybeGraph = reduced.graph.copy();
          maybeGraph.accept(elements[i]);
          const maybeCompleteness = measure(this.tree, maybeGraph, Metric.COMPLETENESS);
          const maybeMinimality = measure(this.tree, maybeGraph, Metric.MINIMALITY);
          candidates.push({
            graph: maybeGraph,
            completeness: maybeCompleteness,
            minimality: maybeMinimality,
            addedElement: elements[i]
          });
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
      reduced = candidates[0];
      elements = elements.filter((e) => e !== candidates[0].addedElement);
      console.log('reduced: ', reduced);
    }

    elements = reduced.graph.elements();

    // while (reduced.minimality < 1.0 && elements.length > 0) {
    //   const candidates: ScoredGraph[] = [];
    //   for (let i = 0; i < elements.length; i++) {
    //     if (reduced.graph.canAccept(elements[i])) {
    //       const maybeGraph = reduced.graph.copy();
    //       maybeGraph.accept(elements[i]);
    //       const maybeCompleteness = measure(this.tree, maybeGraph, Metric.COMPLETENESS);
    //       const maybeMinimality = measure(this.tree, maybeGraph, Metric.MINIMALITY);
    //       candidates.push({
    //         graph: maybeGraph,
    //         completeness: maybeCompleteness,
    //         minimality: maybeMinimality,
    //         addedElement: elements[i]
    //       });
    //     }
    //   }
    //   if (candidates.length === 0) {
    //     break;
    //   }
    //   candidates.sort((prev, next) =>
    //     prev.completeness == next.completeness
    //       ? next.minimality - prev.minimality
    //       : next.completeness - prev.completeness
    //   );
    //   reduced = candidates[0];
    //   elements = elements.filter((e) => e !== candidates[0].addedElement);
    //   console.log('reduced: ', reduced);
    // }

    return reduced;
  }
}
