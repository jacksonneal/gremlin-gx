import { Step } from './Step';
import { GraphConstraint } from '../GraphConstraint';
import { StructConstraint } from '../constraints/ElementConstraint';
import { EqConstraint } from '../constraints/PropertyConstraint';

export class AggregateStringStep implements Step {
  private readonly label: string;

  constructor(label: string) {
    this.label = label;
  }

  passUpstream(graph: GraphConstraint): void {
    if (graph.head.size === 0) {
      // Ensure head has at least one element
      graph.head.add(new StructConstraint());
    }
    [...graph.head].forEach((e) => e.trySet(this.label, new EqConstraint(true)));
    const labelled = graph.elements().filter((e) => e.get(this.label)?.$eq === true);
    graph.head = new Set(labelled);
  }

  passDownstreamCompleteness(graph: GraphConstraint): number {
    const labelled = graph.elements().filter((e) => e.get(this.label)?.$eq === true);
    if (labelled.length > 0) {
      return 1;
    } else {
      return 0;
    }
  }

  passDownstreamMinimality(graph: GraphConstraint): number {
    const labelled = graph.elements().filter((e) => e.get(this.label)?.$eq === true);
    if (labelled.length === 0) {
      // This should not happen, but is minimal
      return 1;
    }
    return 1 / labelled.length;
  }
}
