import { GraphConstraint } from '../GraphConstraint';

export interface Step {
  passUpstream(graph: GraphConstraint);

  passDownstreamCompleteness(graph: GraphConstraint): number;
}
