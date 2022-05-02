import GraphGenerator from './GraphGenerator';
import GremlinGxLexer from '../../generated/parser/GremlinGxLexer';
import GremlinGxParser from '../../generated/parser/GremlinGxParser';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import antlr4 from 'antlr4';
import { ElementConstraint, ElementType } from './constraints/ElementConstraint';
import { FROM, TO } from './constants';
import { ScoredGraph } from './Metric';
import { Step } from './steps/Step';

export const parse = (input: string, mergeLevel: any): [ScoredGraph, Step[]] => {
  const chars = new antlr4.InputStream(input);
  const lexer = new GremlinGxLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new GremlinGxParser(tokens);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  parser.buildParseTrees = true;
  const tree = parser.query();
  const graphGenerator = new GraphGenerator();
  antlr4.tree.ParseTreeWalker.DEFAULT.walk(graphGenerator, tree);
  return graphGenerator.getGraph(mergeLevel);
};

export const toDataset = (elements: Set<ElementConstraint>): any[] => {
  const memberIdMap = new Map<string, string>();

  const toDataObj = (element: ElementConstraint) => {
    const template = {
      data: {
        id: element.uid
      },
      group: element.type === ElementType.VERTEX ? 'nodes' : 'edges'
    };
    element.properties.forEach((constraint, key) => {
      if ([TO, FROM].includes(key)) {
        template.data[key] = memberIdMap.get(constraint.value());
      } else {
        template.data[key] = constraint.value();
      }
    });
    memberIdMap.set(element.uid, element.uid);
    element.memberUids.forEach((mId) => memberIdMap.set(mId, element.uid));
    // element.merged.forEach((member) => elementMap.set(member, template.data.id));
    return template;
  };
  const vertexDataset = [...elements].filter((e) => e.type === ElementType.VERTEX).map(toDataObj);
  const edgeDataset = [...elements].filter((e) => e.type === ElementType.EDGE).map(toDataObj);
  console.log('ELEMENTS-SIZE', elements.size);
  console.log('VERTEX-DATASET-SIZE', vertexDataset.length);
  console.log('EDGE-DATASET-SIZE', edgeDataset.length);
  return vertexDataset.concat(edgeDataset);
};
