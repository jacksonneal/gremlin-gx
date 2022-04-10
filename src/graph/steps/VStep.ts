import { Step } from './Step';
import { GraphConstraint } from '../GraphConstraint';
import { ElementType, VertexConstraint } from '../constraints/ElementConstraint';
import { ID } from '../constants';
import { EqConstraint } from '../constraints/PropertyConstraint';

export class VStep implements Step {
  private readonly ids: Set<string>;

  constructor(ids: Set<string>) {
    this.ids = ids;
  }

  passUpstream(graph: GraphConstraint) {
    if (graph.head.size === 0) {
      // Ensure head has at least one element
      graph.head.add(new VertexConstraint());
    }
    const idsToUse = [...this.ids];
    graph.head.forEach((h) => {
      // Ensure elements in head are vertices
      h.type = ElementType.VERTEX;
      // Attempt to ids
      if (idsToUse.length) {
        h.trySet(ID, new EqConstraint(idsToUse.pop()));
      }
      // Ensure head vertices are tracked
      graph.vertices.add(h);
    });
    // Use leftover ids
    idsToUse.forEach((id) => {
      const v = new VertexConstraint();
      v.trySet(ID, new EqConstraint(id));
      graph.head.add(v);
      graph.vertices.add(v);
    });
  }

  passDownstreamCompleteness(graph: GraphConstraint): number {
    // Set head to all vertices
    graph.head = new Set([...graph.vertices]);
    if (this.ids.size > 0) {
      const vertexIds = [...graph.vertices].map((v) => v.get(ID)?.$eq);
      let included = 0;
      this.ids.forEach((id) => {
        if (vertexIds.includes(id)) {
          included++;
        }
      });
      // Fraction of included ids
      return included / this.ids.size;
    } else {
      // Must have some vertices
      return Math.min(graph.vertices.size, 1);
    }
  }

  passDownstreamMinimality(graph: GraphConstraint): number {
    // Set head to all vertices
    graph.head = new Set([...graph.vertices]);
    if (graph.vertices.size === 0) {
      // This should not happen, but is minimal
      return 1;
    }
    if (this.ids.size > 0) {
      // Minimal case has 1 vertex for each id
      return Math.min(this.ids.size / graph.vertices.size, 1);
    } else {
      // Minimal case has 1 vertex
      return 1 / graph.vertices.size;
    }
  }
}
