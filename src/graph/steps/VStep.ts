import { Step } from './Step';
import { GraphConstraint } from '../GraphConstraint';
import { ElementType, VertexConstraint } from '../ElementConstraint';
import { ID } from '../constants';
import { EqConstraint } from '../PropertyConstraint';

export class VStep implements Step {
  private readonly ids: Set<string>;

  constructor(ids: Set<string>) {
    this.ids = ids;
  }

  passUpstream(graph: GraphConstraint) {
    if (graph.head.size === 0) {
      graph.head.add(new VertexConstraint());
    }

    const idsToUse = [...this.ids];

    graph.head.forEach((h) => {
      h.type = ElementType.VERTEX;

      if (idsToUse.length) {
        h.trySet(ID, new EqConstraint(idsToUse.pop()));
      }

      graph.vertices.add(h);
    });

    idsToUse.forEach((id) => {
      const v = new VertexConstraint();
      v.trySet(ID, new EqConstraint(id));
      graph.head.add(v);
      graph.vertices.add(v);
    });
  }

  passDownstreamCompleteness(graph: GraphConstraint): number {
    graph.head = new Set([...graph.vertices]);
    if (this.ids.size > 0) {
      const headIds = [...graph.head].map((h) => h.get(ID)?.value());
      let included = 0;
      this.ids.forEach((id) => {
        if (headIds.includes(id)) {
          included++;
        }
      });
      return included / this.ids.size;
    } else {
      return Math.min(graph.head.size, 1);
    }
  }
}
