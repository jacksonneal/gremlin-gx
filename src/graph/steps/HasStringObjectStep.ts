import { Step } from './Step';
import { GraphConstraint } from '../GraphConstraint';
import { ElementConstraint, StructConstraint } from '../constraints/ElementConstraint';
import { EqConstraint, NeqConstraint } from '../constraints/PropertyConstraint';

export class HasStringObjectStep implements Step {
  private readonly key: string;
  private readonly value: any;

  constructor(key: string, value: any) {
    this.key = key;
    this.value = value;
  }

  passUpstream(graph: GraphConstraint): void {
    if (graph.head.size === 0) {
      // Ensure head has at least one element
      graph.head.add(new StructConstraint());
    }
    graph.head.forEach((h) => {
      // Make all head elements pass the filter
      h.trySet(this.key, new EqConstraint(this.value));
    });
    // Add an element to fail the filter
    const failElement = new StructConstraint();
    failElement.trySet(this.key, new NeqConstraint(this.value));
    graph.head.add(failElement);
  }

  passDownstream(graph: GraphConstraint): [number, number] {
    const nextHead = new Set<ElementConstraint>();
    let pass = 0;
    let fail = 0;
    graph.head.forEach((h) => {
      if (h.get(this.key)?.$eq === this.value) {
        // Add passing elements to head
        nextHead.add(h);
        pass++;
      } else {
        fail++;
      }
    });
    graph.head = nextHead;
    return [pass, fail];
  }

  passDownstreamCompleteness(graph: GraphConstraint): number {
    const [pass, fail]: [number, number] = this.passDownstream(graph);
    if (pass > 0 && fail > 0) {
      return 1;
    } else if (pass > 0 || fail > 0) {
      return 1 / 2;
    } else {
      return 0;
    }
  }

  passDownstreamMinimality(graph: GraphConstraint): number {
    const [pass, fail]: [number, number] = this.passDownstream(graph);
    if (pass === 0 && fail == 0) {
      // This should not happen, but is minimal
      return 1;
    }
    // Minimal case has 1 pass and 1 fail
    return Math.min(2 / pass + fail, 1);
  }
}
