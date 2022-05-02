import GremlinGxListener from '../../generated/parser/GremlinGxListener';
import {GraphConstraint} from './GraphConstraint';
import {Step} from './steps/Step';
import {VStep} from './steps/VStep';
import {OutStep} from './steps/OutStep';
import {HasStringObjectStep} from './steps/HasStringObjectStep';
import {measure, Metric, ScoredGraph} from './Metric';
import {TraversalPredicate, WherePStep} from './steps/WherePStep';
import {AsStep} from './steps/AsStep';
import {AggregateStringStep} from './steps/AggregateStringStep';
import {GroupCountEmptyStep} from './steps/GroupCountEmptyStep';
import * as $C from 'js-combinatorics';

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

  exitTraversalMethod_where_P(ctx) {
    super.exitTraversalMethod_where_P(ctx);
    let type: TraversalPredicate = 'eq';
    let pred = ctx.traversalPredicate().traversalPredicate_eq();
    let value = null;
    if (pred != null) {
      value = pred.genericLiteral().getText().slice(1, -1);
    }
    if (pred === null) {
      type = 'neq';
      pred = ctx.traversalPredicate().traversalPredicate_neq();
      if (pred != null) {
        value = pred.genericLiteral().getText().slice(1, -1);
      }
    }
    if (pred === null) {
      type = 'without';
      pred = ctx.traversalPredicate().traversalPredicate_without();
      console.log('pred', pred);
      value = pred
        .genericLiteralList()
        .genericLiteralExpr()
        .genericLiteral()
        .map((gl) => gl.getText().slice(1, -1));
    }
    this.tree.push(new WherePStep(type, value));
  }

  exitTraversalMethod_as(ctx) {
    super.exitTraversalMethod_as(ctx);
    const label = ctx.stringLiteral().getText().slice(1, -1);
    this.tree.push(new AsStep(label));
  }

  exitTraversalMethod_aggregate_String(ctx) {
    super.exitTraversalMethod_aggregate_String(ctx);
    const label = ctx.stringLiteral().getText().slice(1, -1);
    this.tree.push(new AggregateStringStep(label));
  }

  exitTraversalMethod_groupCount_Empty(ctx) {
    super.exitTraversalMethod_groupCount_Empty(ctx);
    this.tree.push(new GroupCountEmptyStep());
  }

  getGraph(mergeLevel: any): [ScoredGraph, Step[]] {
    console.log('MERGE-LEVEL', mergeLevel);
    const skipMerge = mergeLevel === 'off';
    const mergeNeighbors = mergeLevel !== 'no-self-loop';

    const graph = new GraphConstraint();

    for (let i = this.tree.length - 1; i >= 0; i--) {
      this.tree[i].passUpstream(graph);
    }

    console.log('UPSTREAM-SIZE', graph.elements().length);

    const candidates: ScoredGraph[] = [];

    if (skipMerge) {
      const scored = {
        graph,
        completeness: measure(this.tree, graph, Metric.COMPLETENESS),
        minimality: measure(this.tree, graph, Metric.MINIMALITY),
        addedElement: null
      };
      candidates.push(scored);
    } else {
      let frontier: GraphConstraint[] = [];
      frontier.push(graph);

      let maxCompleteness = 0;
      let maxMinimality = 0;
      let skipped = 0;
      while (frontier.length) {
        console.log('FRONTIER-SIZE', frontier.length);
        const nextFrontier: GraphConstraint[] = [];
        frontier.forEach((gc) => {
          const scored = {
            graph: gc,
            completeness: measure(this.tree, gc, Metric.COMPLETENESS),
            minimality: measure(this.tree, gc, Metric.MINIMALITY),
            addedElement: null
          };
          if (
            scored.completeness < maxCompleteness ||
            (scored.completeness === maxCompleteness && scored.minimality < maxMinimality)
          ) {
            skipped++;
            return;
          } else {
            maxCompleteness = scored.completeness;
            maxMinimality = scored.minimality;
          }
          candidates.push(scored);
          const vit = new $C.Combination(gc.vertices, 2);
          for (const pair of vit) {
            if (gc.edgeExists(pair[0], pair[1])) {
              console.log('exists');
            }
            if (pair[0].canMerge(pair[1]) && (mergeNeighbors || !gc.edgeExists(pair[0], pair[1]))) {
              const reduced = gc.copy();
              reduced.mergeVertices(pair[0].uid, pair[1].uid);
              nextFrontier.push(reduced);
            }
          }
          const eit = new $C.Combination(gc.edges, 2);
          for (const pair of eit) {
            if (pair[0].canMerge(pair[1])) {
              const reduced = gc.copy();
              reduced.mergeEdges(pair[0].uid, pair[1].uid);
              nextFrontier.push(reduced);
            }
          }
        });
        frontier = nextFrontier.slice(0, 500);
      }
      console.log('SKIPPED', skipped);
    }

    console.log('CANDIDATES-SIZE', candidates.length);

    candidates.sort((prev, next) =>
      prev.completeness === next.completeness
        ? next.minimality === prev.minimality
          ? prev.graph.elements().length - next.graph.elements().length
          : next.minimality - prev.minimality
        : next.completeness - prev.completeness
    );

    console.log('SORTED-CANDIDATES', candidates);

    return [candidates[0], this.tree];

    // let reduced: ScoredGraph = {
    //   graph: new GraphConstraint(),
    //   completeness: 0,
    //   minimality: 0,
    //   addedElement: null
    // };
    // let elements = graph.elements();

    // while (reduced.completeness < 1.0 && elements.length > 0) {
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
    //     console.log('found no candidates');
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

    // elements = reduced.graph.elements();
    // console.log('REDUCED-SIZE', elements.length);

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

    // return reduced;
  }
}
