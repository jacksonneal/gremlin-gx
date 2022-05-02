import { Step } from './Step';
import { GraphConstraint } from '../GraphConstraint';
import { ElementConstraint, StructConstraint } from '../constraints/ElementConstraint';
import { EqConstraint, NeqConstraint } from '../constraints/PropertyConstraint';

export type TraversalPredicate = 'eq' | 'neq' | 'without';

export class WherePStep implements Step {
  private readonly type: TraversalPredicate;
  private readonly value: any;

  constructor(type: TraversalPredicate, value: any) {
    this.type = type;
    this.value = value;
    console.log('VALUE', this.value);
  }

  passUpstream(graph: GraphConstraint): void {
    if (graph.head.size === 0) {
      // Ensure head has at least one element
      graph.head.add(new StructConstraint());
    }
    graph.head.forEach((h) => {
      // Make all head elements pass the filter
      if (this.type === 'eq') {
        h.trySet(this.value, new EqConstraint(true));
      } else if (this.type === 'neq') {
        h.trySet(this.value, new EqConstraint(false));
      } else if (this.type === 'without') {
        this.value.forEach((v) => h.trySet(v, new EqConstraint(false)));
      }
    });
    // Add an element to fail the filter
    const failElement = new StructConstraint();
    if (this.type === 'eq') {
      failElement.trySet(this.value, new EqConstraint(false));
    } else if (this.type === 'neq') {
      failElement.trySet(this.value, new EqConstraint(true));
    } else if (this.type === 'without') {
      this.value.forEach((v) => failElement.trySet(v, new EqConstraint(true)));
      failElement.trySet(this.value, new EqConstraint(true));
    }
    graph.head.add(failElement);
  }

  passDownstream(graph: GraphConstraint): [number, number] {
    const nextHead = new Set<ElementConstraint>();
    let pass = 0;
    let fail = 0;
    graph.head.forEach((h) => {
      if (this.type === 'eq') {
        if (h.get(this.value)?.$eq === true) {
          // Add passing elements to head
          nextHead.add(h);
          pass++;
        } else {
          fail++;
        }
      } else if (this.type === 'neq') {
        if (h.get(this.value)?.$eq === false) {
          // Add passing elements to head
          nextHead.add(h);
          pass++;
        } else {
          fail++;
        }
      } else if (this.type === 'without') {
        const numTrue = this.value.filter((v) => h.get(v)?.$eq === true).length;
        if (numTrue === 0) {
          // Add passing elements to head
          nextHead.add(h);
          pass++;
        } else {
          fail++;
        }
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
