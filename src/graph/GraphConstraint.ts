import { ElementConstraint } from './constraints/ElementConstraint';
import { FROM, TO } from './constants';
import { EqConstraint } from './constraints/PropertyConstraint';

export class GraphConstraint {
  vertices: Set<ElementConstraint>;
  edges: Set<ElementConstraint>;
  head: Set<ElementConstraint>;

  constructor() {
    this.vertices = new Set<ElementConstraint>();
    this.edges = new Set<ElementConstraint>();
    this.head = new Set<ElementConstraint>();
  }

  copy(): GraphConstraint {
    const copy = new GraphConstraint();
    const vMap = new Map();
    this.vertices.forEach((v) => {
      const vCopy = v.copy();
      copy.vertices.add(vCopy);
      vMap.set(v, vCopy);
    });
    this.edges.forEach((e) => {
      const eCopy = e.copy();
      eCopy.trySet(FROM, new EqConstraint(vMap.get(e.get(FROM)?.value())));
      eCopy.trySet(TO, new EqConstraint(vMap.get(e.get(TO)?.value())));
      copy.edges.add(eCopy);
    });
    return copy;
  }

  edgeExists(a: ElementConstraint, b: ElementConstraint): boolean {
    let exists = false;
    this.edges.forEach((e) => {
      if (
        (e.get(FROM)?.value() === a && e.get(TO)?.value() === b) ||
        (e.get(TO)?.value() === a && e.get(FROM)?.value() === b)
      ) {
        exists = true;
      }
    });
    return exists;
  }
}
