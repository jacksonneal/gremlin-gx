import GraphGenerator from './GraphGenerator';
import GremlinGxLexer from '../../generated/parser/GremlinGxLexer';
import GremlinGxParser from '../../generated/parser/GremlinGxParser';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import antlr4 from 'antlr4';
import { ElementConstraint, ElementType } from './constraints/ElementConstraint';
import { FROM, TO } from './constants';

export const parse = (input: string) => {
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
  return graphGenerator.getGraph();
};

export const toDataset = (elements: Set<ElementConstraint>) => {
  const elementMap = new Map<ElementConstraint, string>();

  const toDataObj = (element: ElementConstraint) => {
    const template = {
      data: {
        id: (<any>crypto).randomUUID()
      },
      group: element.type === ElementType.VERTEX ? 'nodes' : 'edges'
    };

    element.properties.forEach((constraint, key) => {
      if ([TO, FROM].includes(key)) {
        template.data[key] = elementMap.get(constraint.value());
      } else {
        template.data[key] = constraint.value();
      }
    });

    elementMap.set(element, template.data.id);

    return template;
  };

  const vertexDataset = [...elements].filter((e) => e.type === ElementType.VERTEX).map(toDataObj);
  const edgeDataset = [...elements].filter((e) => e.type === ElementType.EDGE).map(toDataObj);

  return vertexDataset.concat(edgeDataset);
};
