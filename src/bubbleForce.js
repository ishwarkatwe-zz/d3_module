import * as d3 from 'd3';

export class BubbleForce {

  constructor(element, width, height, dataSet = [], category = [], gap = 200) {
    this.element = element; 
    this.dataSet = dataSet;


    this.width = 940;
    this.height = 600;


  
    // tooltip for mouseover functionality
    //var tooltip = floatingTooltip('gates_tooltip', 240);
  
    // Locations to move bubbles towards, depending
    // on which view mode is selected.
    this.center = { x: width / 2, y: height / 2 };
  
    this.yearCenters = {
      2008: { x: width / 3, y: height / 2 },
      2009: { x: width / 2, y: height / 2 },
      2010: { x: 2 * width / 3, y: height / 2 }
    };
  
    // X locations of the year titles.
    this.yearsTitleX = {
      2008: 160,
      2009: width / 2,
      2010: width - 160
    };
  
    // @v4 strength to apply to the position forces
    this.forceStrength = 0.03;


    this.simulation = null;
  
    this.fillColor = d3.scaleOrdinal()
    .domain(['low', 'medium', 'high'])
    .range(['#d84b2a', '#beccae', '#7aa25c']);
  
    // These will be set in create_nodes and create_vis
    this.tt = null;
    this.svg = null;
    this.bubbles = null;
    this.nodes = [];


    //Binding
    this.render = this.render.bind(this);
    this.chart = this.chart.bind(this);
    this.ticked = this.ticked.bind(this);
    this.charge = this.charge.bind(this);
    this.showTooltip = this.showTooltip.bind(this);
    this.showDetail = this.showDetail.bind(this);
    this.hideDetail = this.showDetail.bind(this);
    this.updatePosition = this.showDetail.bind(this);
  }


  render() {
    var _self = this;
    
  
    _self.tt = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .attr('id', 'gates_tooltip')
    .style('pointer-events', 'none');

  // Set a width if it is provided.

    _self.tt.style('width', 240);
  

  // Initially it is hidden.
  this.hideTooltip();  

    _self.simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(_self.forceStrength).x(_self.center.x))
    .force('y', d3.forceY().strength(_self.forceStrength).y(_self.center.y))
    .force('charge', d3.forceManyBody().strength(_self.charge))
    .on('tick', _self.ticked);
  
    _self.simulation.stop();
  

 

  }


  showDetail(d) {
    var _self = this;
    // change outline to indicate hover state.
    d3.select(this).attr('stroke', 'black');

    var content = '<span class="name">Title: </span><span class="value">' +
                  d.name +
                  '</span><br/>' +
                  '<span class="name">Amount: </span><span class="value">$' +
                 d.value +
                  '</span><br/>' +
                  '<span class="name">Year: </span><span class="value">' +
                  d.year +
                  '</span>';

    this.showTooltip(content, d3.event);
  }

   hideDetail(d) {
    var _self = this;
    // reset outline
    d3.select(this)
      .attr('stroke', d3.rgb(_self.fillColor(d.group)).darker());

    this.hideTooltip();
  }

   hideTooltip() {
    var _self = this;
     
    _self.tt.style('opacity', 0.0);
  }

   showTooltip(content, event) {
    var _self = this;
    _self.tt.style('opacity', 1.0)
      .html(content);

    this.updatePosition(event);
  }

   updatePosition(event) {
    var _self = this;
    var xOffset = 20;
    var yOffset = 10;

    var ttw = _self.tt.style('width');
    var tth = _self.tt.style('height');

    var wscrY = window.scrollY;
    var wscrX = window.scrollX;

    var curX = (document.all) ? event.clientX + wscrX : event.pageX;
    var curY = (document.all) ? event.clientY + wscrY : event.pageY;
    var ttleft = ((curX - wscrX + xOffset * 2 + ttw) > window.innerWidth) ?
                 curX - ttw - xOffset * 2 : curX + xOffset;

    if (ttleft < wscrX + xOffset) {
      ttleft = wscrX + xOffset;
    }

    var tttop = ((curY - wscrY + yOffset * 2 + tth) > window.innerHeight) ?
                curY - tth - yOffset * 2 : curY + yOffset;

    if (tttop < wscrY + yOffset) {
      tttop = curY + yOffset;
    }

    _self.tt
      .style('top', tttop + 'px')
      .style('left', ttleft + 'px');
  }

    chart () {
      var _self = this;
    // convert raw data into nodes data
    _self.nodes = this.createNodes(_self.dataSet);

    // Create a SVG element inside the provided selector
    // with desired size.
    _self.svg = d3.select(_self.element)
      .append('svg')
      .attr('width', _self.width)
      .attr('height', _self.height);

    // Bind nodes data to what will become DOM elements to represent them.
    _self.bubbles = _self.svg.selectAll('.bubble')
      .data(_self.nodes, function (d) { return d.id; });

    // Create new circle elements each with class `bubble`.
    // There will be one circle.bubble for each object in the nodes array.
    // Initially, their radius (r attribute) will be 0.
    // @v4 Selections are immutable, so lets capture the
    //  enter selection to apply our transtition to below.
    var bubblesE = _self.bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) { return _self.fillColor(d.group); })
      .attr('stroke', function (d) { return d3.rgb(_self.fillColor(d.group)).darker(); })
      .attr('stroke-width', 2)
       .on('mouseover', _self.showDetail)
       .on('mouseout', _self.hideDetail);

    // @v4 Merge the original empty selection and the enter selection
    _self.bubbles = _self.bubbles.merge(bubblesE);

    // Fancy transition to make bubbles appear, ending with the
    // correct radius
    _self.bubbles.transition()
      .duration(2000)
      .attr('r', function (d) { return d.radius; });

    // Set the simulation's nodes to our newly created nodes array.
    // @v4 Once we set the nodes, the simulation will start running automatically!
 
    _self.simulation.nodes(_self.nodes);
    // Set initial layout to single group.
    this.groupBubbles();
  };


   groupBubbles() {
    //this.hideYearTitles();
    var _self = this;
    // @v4 Reset the 'x' force to draw the bubbles to the center.
    _self.simulation.force('x', d3.forceX().strength(_self.forceStrength).x(_self.center.x));

    // @v4 We can reset the alpha value and restart the simulation
    _self.simulation.alpha(1).restart();
  }


   createNodes(rawData) {
    var _self = this;

    // Use the max total_amount in the data as the max in the scale's domain
    // note we have to ensure the total_amount is a number.
    var maxAmount = d3.max(rawData, function (d) { return +d.total_amount; });

    // Sizes bubbles based on area.
    // @v4: new flattened scale names.
    var radiusScale = d3.scalePow()
      .exponent(0.5)
      .range([2, 85])
      .domain([0, maxAmount]);

    // Use map() to convert raw data into node data.
    // Checkout http://learnjsdata.com/ for more on
    // working with data.
    var myNodes = rawData.map(function (d) {
      return {
        id: d.id,
        radius: radiusScale(+d.total_amount),
        value: +d.total_amount,
        name: d.grant_title,
        org: d.organization,
        group: d.group,
        year: d.start_year,
        x: Math.random() * 900,
        y: Math.random() * 800
      };
    });

    // sort them to prevent occlusion of smaller nodes.
    myNodes.sort(function (a, b) { return b.value - a.value; });

    return myNodes;
  }



  ticked() {
    var _self = this;
    _self.bubbles
      .attr('cx', function (d) { return d.x; })
      .attr('cy', function (d) { return d.y; });
  }

   charge(d) {
    var _self = this;
    return -Math.pow(d.radius, 2.0) * _self.forceStrength;
  }

}

