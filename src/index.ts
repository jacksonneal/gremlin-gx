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
import fancy from './stylesheets/fancy.json';
import plainPath from './stylesheets/plain.cycss';

const onContentLoaded = () => {
  $("body").show();

  cytoscape.use(cola);

  const tryPromise = (fn) => Promise.resolve().then(fn);

  const toText = (obj) => obj.text();

  const cy = cytoscape({
    container: $('#cy')
  });

  const $stylesheet = $('#style');
  const getStylesheet = (name) => {
    if (name === 'fancy.json') {
      return fancy;
    } else if (name === 'plain.cycss') {
      return fetch(plainPath).then(toText);
    } else {
      return {};
    }
  };
  const applyStylesheet = (stylesheet) => {
    if (typeof stylesheet === typeof '') {
      cy.style().fromString(stylesheet).update();
    } else {
      cy.style().fromJson(stylesheet).update();
    }
  };
  const applyStylesheetFromSelect = () => Promise.resolve($stylesheet.val()).then(getStylesheet).then(applyStylesheet);

  const $query = $(`#query`);
  const getDataset = (query) => toDataset(parse(query));
  const applyDataset = (dataset) => {
    cy.zoom(0.001);
    cy.pan({ x: -9999999, y: -9999999 });
    cy.elements().remove();
    cy.add(dataset);
  };
  const applyDatasetFromSelect = () => Promise.resolve($query.val()).then(getDataset).then(applyDataset);

  const calculateCachedCentrality = () => {
    const nodes = cy.nodes();
    if (nodes.length > 0 && nodes[0].data('centrality') == null) {
      const centrality = cy.elements().closenessCentralityNormalized();
      nodes.forEach((n) => n.data('centrality', centrality.closeness(n)));
    }
  };

  const $layout = $('#layout');
  const maxLayoutDuration = 1500;
  const layoutPadding = 50;
  const concentric = (node) => {
    calculateCachedCentrality();
    return node.data('centrality');
  };
  const levelWidth = (nodes) => {
    calculateCachedCentrality();
    const min = nodes.min((n) => n.data('centrality')).value;
    const max = nodes.max((n) => n.data('centrality')).value;
    return (max - min) / 5;
  };
  const layouts = {
    cola: {
      name: 'cola',
      padding: layoutPadding,
      nodeSpacing: 12,
      edgeLengthVal: 45,
      animate: true,
      randomize: true,
      maxSimulationTime: maxLayoutDuration,
      boundingBox: {
        // to give cola more space to resolve initial overlaps
        x1: 0,
        y1: 0,
        x2: 10000,
        y2: 10000
      },
      edgeLength: function (e) {
        let w = e.data('weight');

        if (w == null) {
          w = 0.5;
        }

        return 45 / w;
      }
    },
    concentricCentrality: {
      name: 'concentric',
      padding: layoutPadding,
      animate: true,
      animationDuration: maxLayoutDuration,
      concentric: concentric,
      levelWidth: levelWidth
    },
    concentricHierarchyCentrality: {
      name: 'concentric',
      padding: layoutPadding,
      animate: true,
      animationDuration: maxLayoutDuration,
      concentric: concentric,
      levelWidth: levelWidth,
      sweep: (Math.PI * 2) / 3,
      clockwise: true,
      startAngle: Math.PI / 6
    }
  };
  let prevLayout;
  const getLayout = (name) => Promise.resolve(layouts[name]);
  const applyLayout = (layout) => {
    if (prevLayout) {
      prevLayout.stop();
    }
    const l = (prevLayout = cy.makeLayout(layout));
    return l.run().promiseOn('layoutstop');
  };
  const applyLayoutFromSelect = () => Promise.resolve($layout.val()).then(getLayout).then(applyLayout);

  $stylesheet.on('change', applyStylesheetFromSelect);

  $query.on('input', () => {
    tryPromise(applyDatasetFromSelect).then(applyLayoutFromSelect);
  });

  $layout.on('change', applyLayoutFromSelect);
  $('#redo-layout').on('click', applyLayoutFromSelect);

  (<any>$('.tooltip')).tooltipster();

  $query.val("g.V().out().has('name', 'Jax')");

  tryPromise(applyDatasetFromSelect).then(applyStylesheetFromSelect).then(applyLayoutFromSelect);
};

document.addEventListener('DOMContentLoaded', onContentLoaded);
