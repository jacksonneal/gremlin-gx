import { GraphConstraint } from './GraphConstraint';
import { Step } from './steps/Step';
import { ElementConstraint } from './constraints/ElementConstraint';

export interface ScoredGraph {
  graph: GraphConstraint;
  completeness: number;
  minimality: number;
  addedElement: ElementConstraint | null;
}

export enum Metric {
  COMPLETENESS = 'completeness',
  MINIMALITY = 'minimality'
}

export const measure = (tree: Step[], graph: GraphConstraint, metric: Metric): number => {
  let total = 0;
  for (let i = 0; i < tree.length; i++) {
    total +=
      metric === Metric.COMPLETENESS
        ? tree[i].passDownstreamCompleteness(graph)
        : tree[i].passDownstreamMinimality(graph);
  }
  return total / tree.length;
};
