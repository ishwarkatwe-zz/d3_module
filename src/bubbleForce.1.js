import * as d3 from 'd3';

export class BubbleForce {

  constructor(element, height, width, dataSet = [], gap = 200) {
    this.element = element;
    this.dataSet = dataSet;


    this.width = width;
    this.height = height;

    // Locations to move bubbles towards, depending
    // on which view mode is selected.
    this.center = {x: width / 2, y: height / 2};

    this.yearCenters = {
      2008: {x: width / 3, y: height / 2},
      2009: {x: width / 2, y: height / 2},
      2010: {x: 2 * width / 3, y: height / 2}
    };

    this.impactCenters = {
      low: {x: width / 3, y: height / 2},
      medium: {x: width / 2, y: height / 2},
      high: {x: 2 * width / 3, y: height / 2}
    };

    this.impactTitleX = {
      low: 160,
      medium: width / 3,
      high: width / 1.5
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
    this.svg = null;
    this.bubbles = null;
    this.nodes = [];


    //Binding
    this.render = this.render.bind(this);
    this.chart = this.chart.bind(this);
    this.ticked = this.ticked.bind(this);
    this.charge = this.charge.bind(this);
    this.nodeYearPos = this.nodeYearPos.bind(this);
    this.nodeImpactPos = this.nodeImpactPos.bind(this);

  }


  render() {
    var _self = this;


    _self.simulation = d3.forceSimulation()
      .velocityDecay(0.2)
      .force('x', d3.forceX().strength(_self.forceStrength).x(_self.center.x))
      .force('y', d3.forceY().strength(_self.forceStrength).y(_self.center.y))
      .force('charge', d3.forceManyBody().strength(_self.charge))
      .on('tick', _self.ticked);

    _self.simulation.stop();


    // Initially it is hidden.
    this.tooltipFun();
  }


  tooltipFun() {
    var _self = this;
    _self.tooltip = d3.select("body")
      .append("div")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden")
      .style("color", "white")
      .style("padding", "8px")
      .style("background-color", "rgba(0, 0, 0, 0.75)")
      .style("border-radius", "6px")
      .style("font", "12px sans-serif")
      .text("tooltip");
  }


  chart() {
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
      .data(_self.nodes, function (d) {
        return d.id;
      });

    // Create new circle elements each with class `bubble`.
    // There will be one circle.bubble for each object in the nodes array.
    // Initially, their radius (r attribute) will be 0.
    // @v4 Selections are immutable, so lets capture the
    //  enter selection to apply our transtition to below.
    var bubblesE = _self.bubbles.enter().append('circle')
      .classed('bubble', true)
      .attr('r', 0)
      .attr('fill', function (d) {
        return _self.fillColor(d.group);
      })
      .attr('stroke', function (d) {
        return d3.rgb(_self.fillColor(d.group)).darker();
      })
      .attr('stroke-width', 2)
      .on("mouseover", function (d) {

        _self.tooltip.html('<span class="name">Title: </span><span class="value">' +
          d.name +
          '</span><br/>' +
       /*   '<span class="name">Amount: </span><span class="value">' +
          _self.addCommas(d.value) +
          '</span><br/>' +*/
          '<span class="name">Impact: </span><span class="value">' +
          d.group +
          '</span><br/>'+
          '<span class="name">Year: </span><span class="value">' +
          d.year +
          '</span>');
        _self.tooltip.style("visibility", "visible");
      })
      .on("mousemove", function () {
        return _self.tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
      })
      .on("mouseout", function () {
        return _self.tooltip.style("visibility", "hidden");
      })


    // @v4 Merge the original empty selection and the enter selection
    _self.bubbles = _self.bubbles.merge(bubblesE);

    // Fancy transition to make bubbles appear, ending with the
    // correct radius
    _self.bubbles.transition()
      .duration(2000)
      .attr('r', function (d) {
        return d.radius;
      });

    // Set the simulation's nodes to our newly created nodes array.
    // @v4 Once we set the nodes, the simulation will start running automatically!

    _self.simulation.nodes(_self.nodes);
    // Set initial layout to single group.

  };

  splitImpact() {
    var _self = this;

    _self.svg.selectAll('.year').remove();

    this.showImpactTitles();

    // @v4 Reset the 'x' force to draw the bubbles to their year centers
    _self.simulation.force('x', d3.forceX().strength(_self.forceStrength).x(this.nodeImpactPos));

    // @v4 We can reset the alpha value and restart the simulation
    _self.simulation.alpha(1).restart();
  }


  showImpactTitles() {
    var _self = this;
    // Another way to do this would be to create
    // the year texts once and then just hide them.
    var yearsData = d3.keys(_self.impactTitleX);
    var years = _self.svg.selectAll('.impact')
      .data(yearsData);

    years.enter().append('text')
      .attr('class', 'impact')
      .attr('x', function (d) {
        return _self.impactTitleX[d];
      })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text(function (d) {
        return d;
      });


  }

  nodeImpactPos(d) {
    var _self = this;
    return _self.impactCenters[d.group].x;
  }

  splitBubbles() {
    var _self = this;

    _self.svg.selectAll('.impact').remove();

    this.showYearTitles();

    // @v4 Reset the 'x' force to draw the bubbles to their year centers
    _self.simulation.force('x', d3.forceX().strength(_self.forceStrength).x(this.nodeYearPos));

    // @v4 We can reset the alpha value and restart the simulation
    _self.simulation.alpha(1).restart();
  }


  nodeYearPos(d) {
    var _self = this;
    return _self.yearCenters[d.year].x;
  }

  /*
   * Hides Year title displays.
   */
  hideYearTitles() {
    var _self = this;
    _self.svg.selectAll('.year').remove();
    _self.svg.selectAll('.impact').remove();

  }

  /*
   * Shows Year title displays.
   */
  showYearTitles() {
    var _self = this;
    // Another way to do this would be to create
    // the year texts once and then just hide them.
    var yearsData = d3.keys(_self.yearsTitleX);
    var years = _self.svg.selectAll('.year')
      .data(yearsData);

    years.enter().append('text')
      .attr('class', 'year')
      .attr('x', function (d) {
        return _self.yearsTitleX[d];
      })
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text(function (d) {
        return d;
      });
  }

  groupBubbles() {


    var _self = this;

    this.hideYearTitles();

    // @v4 Reset the 'x' force to draw the bubbles to the center.
    _self.simulation.force('x', d3.forceX().strength(_self.forceStrength).x(_self.center.x));

    // @v4 We can reset the alpha value and restart the simulation
    _self.simulation.alpha(1).restart();
  }


  createNodes(rawData) {
    var _self = this;

    // Use the max total_amount in the data as the max in the scale's domain
    // note we have to ensure the total_amount is a number.
    var maxAmount = d3.max(rawData, function (d) {
      return +d.total_amount;
    });

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
    myNodes.sort(function (a, b) {
      return b.value - a.value;
    });

    return myNodes;
  }


  /*
   * Helper function to convert a number into a string
   * and add commas to it to improve presentation.
   */
  addCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }

    return x1 + x2;
  }


  ticked() {
    var _self = this;
    _self.bubbles
      .attr('cx', function (d) {
        return d.x;
      })
      .attr('cy', function (d) {
        return d.y;
      });
  }

  charge(d) {
    var _self = this;
    return -Math.pow(d.radius, 2.0) * _self.forceStrength;
  }

}

