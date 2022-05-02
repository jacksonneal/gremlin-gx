import { Step } from './Step';
import { GraphConstraint } from '../GraphConstraint';
import { StructConstraint } from '../constraints/ElementConstraint';

export class GroupCountEmptyStep implements Step {
  passUpstream(graph: GraphConstraint): void {
    if (graph.head.size === 0) {
      // Ensure head has at least one element
      graph.head.add(new StructConstraint());
    }
    // Duplicate all records to allow grouping
    const dups = [...graph.head].map((e) => e.copy());
    dups.forEach((e) => e.count++);
    graph.head = new Set(dups);
    console.log('GC:HEAD', graph.head);
  }

  passDownstreamCompleteness(graph: GraphConstraint): number {
    // const counts: Map<string, number> = [...graph.head]
    //   .map((e) => e.uid)
    //   .reduce((acc, cur) => acc.set(cur, (acc.get(cur) || 0) + 1), new Map());
    // console.log("GC:COMPLETENESS", Array.from(counts.values()));
    const counts = [...graph.head].map((h) => h.count);
    return Math.max.apply(this, Array.from(counts)) > 1 ? 1 : 0;
  }

  passDownstreamMinimality(graph: GraphConstraint): number {
    // const counts: Map<string, number> = [...graph.head]
    //   .map((e) => e.uid)
    //   .reduce((acc, cur) => acc.set(cur, (acc.get(cur) || 0) + 1), new Map());
    // const numGroups = Array.from(counts.values()).filter((c) => c > 1).length;
    // if (numGroups === 0) {
    //   return 1;
    // }
    // return 1 / numGroups;
    const counts = [...graph.head].map((h) => h.count);
    if (counts.length === 0) {
      return 1;
    }
    return 1 / counts.filter((c) => c > 1).length;
  }
}
