import $ from 'jquery';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import { parse, toDataset } from './graph/GraphParser';
import './css/index.css';
import '@fontsource/open-sans';
import 'skeleton-css/css/normalize.css';
import 'skeleton-css/css/skeleton.css';
import 'font-awesome/css/font-awesome.css';
import 'tooltipster/dist/js/tooltipster.bundle.min.js';
import 'tooltipster/dist/css/tooltipster.bundle.min.css';
import { ScoredGraph } from './graph/Metric';
import _ from 'lodash';
import { animate } from './graph/animate';
import { GraphConstraint } from './graph/GraphConstraint';
import { Step } from './graph/steps/Step';
import { formatQuery } from 'gremlint';

const onContentLoaded = () => {
  $('body').show();

  cytoscape.use(cola);

  const tryPromise = (fn) => Promise.resolve().then(fn);

  const cy = cytoscape({
    container: $('#cy')
  });

  cy.style()
    .selector('node')
    .style({
      'background-color': '#555',
      'text-outline-color': '#555',
      'text-outline-width': '2px',
      color: '#fff',
      'overlay-padding': '5px'
    })
    .selector('node[?name]')
    .style({
      'font-size': '9px',
      'text-valign': 'center',
      'text-halign': 'center',
      label: 'data(name)',
      'overlay-padding': '6px'
    })
    .selector('node:selected')
    .style({
      'border-width': '5px',
      'border-color': '#AAD8FF',
      'border-opacity': '0.75',
      'text-outline-color': '#AAD8FF',
      'text-outline-width': '2px'
    })
    .selector('node.head')
    .style({
      'border-color': 'rgba(117,53,169,0.75)',
      'border-width': '5px',
      'border-opacity': 0.75
    })
    .selector('edge')
    .style({
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle',
      opacity: '0.5',
      'line-color': '#aaa',
      'overlay-padding': '3px',
      'line-cap': 'round'
    })
    .selector('edge:selected')
    .style({
      opacity: '1.0'
    })
    .selector('edge.highlighted')
    .style({
      opacity: '1.0'
    });

  const $query = $(`#query`);
  const getGraph = (query): [ScoredGraph, Step[]] => {
    const $merge = $(`input[name='merge-level']:checked`);
    return parse(query, $merge.val());
  };
  let graph: GraphConstraint;
  let steps: Step[];
  const applyGraph = (res: [ScoredGraph, Step[]]) => {
    const scoredGraph = res[0];
    graph = scoredGraph.graph;
    steps = res[1];
    const dataset = toDataset(new Set(graph.elements()));
    cy.zoom(0.001);
    cy.pan({ x: -9999999, y: -9999999 });
    cy.elements().remove();
    cy.add(dataset);
    $('#completeness').html(scoredGraph.completeness.toFixed(4));
    $('#minimality').html(scoredGraph.minimality.toFixed(4));
  };
  const applyGraphFromInput = () => Promise.resolve($query.val()).then(getGraph).then(applyGraph);

  const maxLayoutDuration = 1500;
  const layoutPadding = 50;
  const layout = {
    name: 'cola',
    padding: layoutPadding,
    nodeSpacing: 12,
    edgeLengthVal: 45,
    animate: true,
    randomize: true,
    maxSimulationTime: maxLayoutDuration
    // boundingBox: {
    //   // to give cola more space to resolve initial overlaps
    //   x1: 0,
    //   y1: 0,
    //   x2: 10000,
    //   y2: 10000
    // }
  };

  const applyLayout = () => {
    const l = cy.makeLayout(layout);
    return l.run();
  };

  $query.on(
    'input',
    _.debounce(() => tryPromise(applyGraphFromInput).then(applyLayout), 500)
  );

  $(`input[name='merge-level']`).on(
    'change',
    _.debounce(() => tryPromise(applyGraphFromInput).then(applyLayout), 100)
  );

  (<any>$('.tooltip')).tooltipster();

  $query.val(`g.V()`);

  cy.on('select', (e) => {
    console.log(e.target.data());
  });

  $(`#format`).on('click', () => {
    const formattedQuery = formatQuery(<string>$query.val(), { maxLineLength: 30 });
    $query.val(formattedQuery);
    // console.log(formattedQuery);
    // alert('do formatting');
  });

  $(`#animate`).on('click', () => {
    animate(cy, steps, graph);
    // alert('do animation');
  });

  tryPromise(applyGraphFromInput).then(applyLayout);
};

document.addEventListener('DOMContentLoaded', onContentLoaded);
