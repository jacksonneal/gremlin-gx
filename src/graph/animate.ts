import { Step } from './steps/Step';
import { GraphConstraint } from './GraphConstraint';

export const animate = (cy: any, tree: Step[], graph: GraphConstraint) => {
  let i = 0;
  const highlightHead = () => {
    cy.nodes().removeClass('head');
    if (i < tree.length) {
      tree[i].passDownstreamCompleteness(graph);
      graph.head.forEach((e) => {
        cy.$(`node#${e.uid}`).addClass('head');
      });
      i++;
      setTimeout(highlightHead, 1000);
    }
  };
  highlightHead();
};
