import { Step } from './Step';
import { GraphConstraint } from '../GraphConstraint';
import { ElementConstraint, StructConstraint } from '../ElementConstraint';
import { EqConstraint, NeqConstraint } from '../PropertyConstraint';

export class HasStringObjectStep implements Step {
  private readonly key: string;
  private readonly value: any;

  constructor(key: string, value: any) {
    this.key = key;
    this.value = value;
  }

  passUpstream(graph: GraphConstraint): void {
    if (graph.head.size === 0) {
      graph.head.add(new StructConstraint());
    }

    graph.head.forEach((h) => {
      h.trySet(this.key, new EqConstraint(this.value));
    });

    const failElement = new StructConstraint();
    failElement.trySet(this.key, new NeqConstraint(this.value));
    graph.head.add(failElement);
  }

  passDownstreamCompleteness(graph: GraphConstraint): number {
    const nextHead = new Set<ElementConstraint>();
    let pass = false;
    let fail = false;
    graph.head.forEach((h) => {
      if (h.get(this.key)?.value() === this.value) {
        pass = true;
        nextHead.add(h);
      } else if (h.get(this.key)?.value() !== this.value) {
        fail = true;
      }
    });
    graph.head = nextHead;

    let ret = 0;
    if (pass) {
      ret++;
    }
    if (fail) {
      ret++;
    }
    return ret / 2;
  }
}
