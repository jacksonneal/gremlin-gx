import { GraphConstraint } from '../GraphConstraint';
import { EquivalenceClass } from '../constraints/EquivalenceClass';

export interface Step {
  passUpstream(graph: GraphConstraint);

  passDownstreamCompleteness(graph: GraphConstraint): number;

  passDownstreamMinimality(graph: GraphConstraint): number;
}
//
// abstract class AbstractStep implements Step {
//   ecs: EquivalenceClass[];
//
//   protected constructor(ecs: EquivalenceClass[]) {
//     this.ecs = ecs;
//   }
//
//   passDownstreamCompleteness(graph: GraphConstraint): number {
//     return 0;
//   }
//
//   passDownstreamMinimality(graph: GraphConstraint): number {
//     return 0;
//   }
//
//   passUpstream(graph: GraphConstraint) {
//     if (graph.head.size === 0) {
//
//     }
//   }
// }
