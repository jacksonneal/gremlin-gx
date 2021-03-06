import { ElementConstraint, ElementType } from './constraints/ElementConstraint';
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

  mergeVertices(aUid: string, bUid: string) {
    const a = this.findVertex(aUid);
    const b = this.findVertex(bUid);
    if (a == null || b == null) {
      return;
    }
    this.vertices.delete(a);
    this.vertices.delete(b);
    const ab = a.merge(b);
    this.add(ab);
    this.edges.forEach((e) => {
      e.trySet(FROM, new EqConstraint(this.findVertex(e.get(FROM)?.$eq)?.uid));
      e.trySet(TO, new EqConstraint(this.findVertex(e.get(TO)?.$eq)?.uid));
    });
    return 0;
  }

  mergeEdges(aUid: string, bUid: string) {
    const a = this.findEdge(aUid);
    const b = this.findEdge(bUid);
    if (a == null || b == null) {
      return;
    }
    this.edges.delete(a);
    this.edges.delete(b);
    const ab = a.merge(b);
    this.add(ab);
    this.edges.forEach((e) => {
      e.trySet(FROM, new EqConstraint(this.findVertex(e.get(FROM)?.$eq)?.uid));
      e.trySet(TO, new EqConstraint(this.findVertex(e.get(TO)?.$eq)?.uid));
    });
    return 0;
  }

  elements(): ElementConstraint[] {
    return [...new Set([...this.vertices, ...this.edges, ...this.head])];
  }

  canAccept(element: ElementConstraint): boolean {
    return element.type === ElementType.VERTEX || this.endpointsExist(element);
  }

  endpointsExist(e: ElementConstraint): boolean {
    const vertexArr = [...this.vertices];
    const fromId: string = e.get(FROM)?.$eq;
    const toId: string = e.get(TO)?.$eq;
    return vertexArr.some((v) => v.coversId(fromId)) && vertexArr.some((v) => v.coversId(toId));
  }

  accept(element: ElementConstraint) {
    if (element.type === ElementType.EDGE) {
      element.trySet(FROM, new EqConstraint(this.findVertex(element.get(FROM)?.$eq)?.uid));
      element.trySet(TO, new EqConstraint(this.findVertex(element.get(TO)?.$eq)?.uid));
    }
    const mostSimilarMergeable = this.findMostSimilar(element);
    if (true || mostSimilarMergeable === null) {
      this.add(element);
    } else {
      // const merged = mostSimilarMergeable.merge(element);
      // this.remove(mostSimilarMergeable);
      // this.add(merged);
      // this.edges.forEach((e) => {
      //   e.trySet(FROM, new EqConstraint(this.findVertex(e.get(FROM)?.$eq)?.uid));
      //   e.trySet(TO, new EqConstraint(this.findVertex(e.get(TO)?.$eq)?.uid));
      // });
    }
  }

  findMostSimilar(element: ElementConstraint): ElementConstraint | null {
    const candidates = this.elements().filter((candidate) => element.canMerge(candidate));
    if (candidates.length === 0) {
      return null;
    }
    let mostSimilarMergeable = candidates[0];
    let minDiff = mostSimilarMergeable.diffKeyScore(element);
    candidates.forEach((candidate) => {
      const diffScore = candidate.diffKeyScore(element);
      if (diffScore < minDiff) {
        mostSimilarMergeable = candidate;
        minDiff = diffScore;
      }
    });
    return mostSimilarMergeable;
  }

  remove(element: ElementConstraint) {
    if (element.type === ElementType.VERTEX) {
      this.vertices.delete(element);
    } else {
      this.edges.delete(element);
    }
  }

  add(element: ElementConstraint) {
    if (element.type === ElementType.VERTEX) {
      this.vertices.add(element);
    } else {
      this.edges.add(element);
    }
  }

  copy(): GraphConstraint {
    const copy = new GraphConstraint();
    this.elements()
      .map((e) => e.copy())
      .forEach((e) => copy.add(e));
    // const vMap = new Map();
    // this.vertices.forEach((v) => {
    //   const vCopy = v.copy();
    //   copy.vertices.add(vCopy);
    //   vMap.set(v, vCopy);
    // });
    // this.edges.forEach((e) => {
    //   const eCopy = e.copy();
    //   eCopy.trySet(FROM, new EqConstraint(vMap.get(e.get(FROM)?.value())));
    //   eCopy.trySet(TO, new EqConstraint(vMap.get(e.get(TO)?.value())));
    //   copy.edges.add(eCopy);
    // });
    return copy;
  }

  findVertex(uid: string): ElementConstraint | undefined {
    return [...this.vertices].find((v) => v.coversId(uid));
  }

  findEdge(uid: string): ElementConstraint | undefined {
    return [...this.edges].find((v) => v.coversId(uid));
  }

  edgeExists(a: ElementConstraint, b: ElementConstraint): boolean {
    let exists = false;
    this.edges.forEach((e) => {
      if (
        (a.coversId(e.get(FROM)?.$eq) && b.coversId(e.get(TO)?.$eq)) ||
        (a.coversId(e.get(TO)?.$eq) && b.coversId(e.get(FROM)?.$eq))
      ) {
        exists = true;
      }
    });
    return exists;
  }
}
