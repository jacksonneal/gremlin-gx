import { Step } from './Step';
import { GraphConstraint } from '../GraphConstraint';
import { EdgeConstraint, ElementConstraint, ElementType, VertexConstraint } from '../constraints/ElementConstraint';
import { FROM, LABEL, TO } from '../constants';
import { EqConstraint } from '../constraints/PropertyConstraint';

export class OutStep implements Step {
  private readonly labels: Set<string>;

  constructor(labels: Set<string>) {
    this.labels = labels;
  }

  passUpstream(graph: GraphConstraint): void {
    if (graph.head.size === 0) {
      // Ensure head has at least one element
      graph.head.add(new VertexConstraint());
    }
    const nextHead: Set<ElementConstraint> = new Set();
    const labelsToUse = [...this.labels];
    graph.head.forEach((h) => {
      // Ensure elements in head are vertices
      h.type = ElementType.VERTEX;
      // Create from->h
      const from = new VertexConstraint();
      const edge = new EdgeConstraint();
      edge.trySet(FROM, new EqConstraint(from.uid));
      edge.trySet(TO, new EqConstraint(h.uid));
      // Attempt to use labels
      if (labelsToUse.length) {
        edge.trySet(LABEL, new EqConstraint(labelsToUse.pop()));
      }
      // Add elements
      graph.vertices.add(h);
      graph.vertices.add(from);
      graph.edges.add(edge);
      // Move head to from vertices
      nextHead.add(from);
    });
    // Use leftover labels
    labelsToUse.forEach((label) => {
      // Create from->to
      const from = new VertexConstraint();
      const to = new VertexConstraint();
      const edge = new EdgeConstraint();
      edge.trySet(FROM, new EqConstraint(from.uid));
      edge.trySet(TO, new EqConstraint(to.uid));
      edge.trySet(LABEL, new EqConstraint(label));
      // Add elements
      graph.vertices.add(from);
      graph.vertices.add(to);
      graph.edges.add(edge);
      // Move head to from vertices
      nextHead.add(from);
    });
    graph.head = nextHead;
  }

  passDownstream(graph: GraphConstraint) {
    const nextHead = new Set<ElementConstraint>();
    const labelsTraversed = new Set<string>();
    graph.head.forEach((h) => {
      graph.edges.forEach((e) => {
        if (h.coversId(e.get(FROM)?.$eq) && (this.labels.size === 0 || this.labels.has(e.get(LABEL)?.$eq))) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          nextHead.add(graph.findVertex(e.get(TO)?.$eq)!);
          labelsTraversed.add(e.get(LABEL)?.$eq);
        }
      });
    });
    graph.head = nextHead;
    return labelsTraversed;
  }

  passDownstreamCompleteness(graph: GraphConstraint): number {
    const labelsTraversed = this.passDownstream(graph);
    if (this.labels.size > 0) {
      let included = 0;
      this.labels.forEach((label) => {
        if (labelsTraversed.has(label)) {
          included++;
        }
      });
      // Fraction of included labels
      return included / this.labels.size;
    } else {
      // Must have some elements in head still
      return Math.min(graph.head.size, 1);
    }
  }

  passDownstreamMinimality(graph: GraphConstraint): number {
    this.passDownstream(graph);
    if (graph.head.size === 0) {
      // This should not happen, but is minimal
      return 1;
    }
    if (this.labels.size > 0) {
      // Minimal case has one out for each label
      return Math.min(this.labels.size / graph.head.size, 1);
    } else {
      // Minimal case has 1 out
      return 1 / graph.head.size;
    }
  }
}
