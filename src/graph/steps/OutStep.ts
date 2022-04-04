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
      graph.head.add(new VertexConstraint());
    }
    const nextHead: Set<ElementConstraint> = new Set();
    const labelsToUse = [...this.labels];

    graph.head.forEach((h) => {
      h.type = ElementType.VERTEX;
      const from = new VertexConstraint();
      const edge = new EdgeConstraint();
      edge.trySet(FROM, new EqConstraint(from.uid));
      edge.trySet(TO, new EqConstraint(h.uid));
      if (labelsToUse.length > 0) {
        edge.trySet(LABEL, new EqConstraint(labelsToUse.pop()));
      }
      graph.vertices.add(h);
      graph.vertices.add(from);
      graph.edges.add(edge);
      nextHead.add(from);
    });

    labelsToUse.forEach((label) => {
      const from = new VertexConstraint();
      const to = new VertexConstraint();
      const edge = new EdgeConstraint();
      edge.trySet(FROM, new EqConstraint(from.uid));
      edge.trySet(TO, new EqConstraint(to.uid));
      edge.trySet(LABEL, new EqConstraint(label));
      graph.vertices.add(from);
      graph.vertices.add(to);
      graph.edges.add(edge);
      nextHead.add(from);
    });
    graph.head = nextHead;
  }

  passDownstreamCompleteness(graph: GraphConstraint): number {
    const nextHead = new Set<ElementConstraint>();
    graph.head.forEach((h) => {
      graph.edges.forEach((e) => {
        if (h.coversId(e.get(FROM)?.value()) && (this.labels.size === 0 || this.labels.has(e.get(LABEL)?.value()))) {
          nextHead.add(graph.findVertex(e.get(TO)?.value())!);
        }
      });
    });

    graph.head = nextHead;

    const numShouldHave = Math.max(this.labels.size, 1);
    return Math.min(1, graph.head.size / numShouldHave);
  }

  passDownstreamMinimality(graph: GraphConstraint): number {
    const nextHead = new Set<ElementConstraint>();
    graph.head.forEach((h) => {
      graph.edges.forEach((e) => {
        if (h.coversId(e.get(FROM)?.value()) && (this.labels.size === 0 || this.labels.has(e.get(LABEL)?.value()))) {
          nextHead.add(graph.findVertex(e.get(TO)?.value())!);
        }
      });
    });

    graph.head = nextHead;

    if (graph.head.size === 0) {
      return 0;
    } else {
      const numShouldHave = Math.max(this.labels.size, 1);
      return Math.min(1, numShouldHave / graph.head.size);
    }
  }
}
