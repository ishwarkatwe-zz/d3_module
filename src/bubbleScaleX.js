import * as d3 from 'd3';

export class BubbleScaleX {

  constructor(element, width, height, dataSet = [], category = [], gap = 200) {
    this.element = element;
    this.width = width;
    this.height = height;
    this.dataSet = dataSet;
    this.gap = gap;
    this.category = category;

    //Scales
    this.xCenter = [];
    var _self = this;
    category.forEach(function (index, i) {
      _self.xCenter.push(i * _self.gap);
    });

    this.radius_scale = d3.scalePow().exponent(0.5).domain([0,
      d3.max(_self.dataSet, function (d) {
        return d.count;
      })
    ]).range([2, 50]);


    //Elements
    this.svg = '';

    //Binding
    this.render = this.render.bind(this);
    this.simulateAxisFun = this.simulateAxisFun.bind(this);
    this.simulateCenterFun = this.simulateCenterFun.bind(this);
    this.ticked = this.ticked.bind(this);
    this.scaleX = this.scaleX.bind(this);
    this.tooltipFun = this.tooltipFun.bind(this);
    this.clickHandler = this.clickHandler.bind(this);

    //Events
    this.clickEvent = null;
  }

  render() {
    var _self = this;
    if (_self.element && _self.width && _self.height && _self.dataSet && _self.category) {

      d3.select(_self.element).select("svg").remove();
      _self.element.innerHTML = '';

      _self.svg = d3.select(_self.element).append("svg").attr("width", _self.width).attr("height", _self.height);

      this.tooltipFun();

    } else {
      console.log('error', 'Failed to init D3 module');
    }
  }

  simulateCenterFun() {
    var _self = this;
    var simulation = d3.forceSimulation(_self.dataSet)
      .force('charge', d3.forceManyBody().strength(5))
      .force('center', d3.forceCenter(_self.width / 2, _self.height / 2))
      .force('x', d3.forceX().x(function (d) {
        return _self.width;
      }))
      .force('collision', d3.forceCollide().radius(function (d) {
        return _self.radius_scale(d.count);
      }))
      .on('tick', _self.ticked);

    simulation.restart();
  }

  simulateAxisFun() {
    var _self = this;
    var simulation = d3.forceSimulation(_self.dataSet)
      .force('charge', d3.forceManyBody().strength(5))
      .force('center', d3.forceCenter(_self.width / 2, _self.height / 2))
      .force('x', d3.forceX().x(function (d) {
        return _self.xCenter[d.category];
      }))
      .force('collision', d3.forceCollide().radius(function (d) {
        return _self.radius_scale(d.count);
      }))
      .on('tick', _self.ticked);

    simulation.restart();

    this.scaleX();
  }

  ticked() {
    var _self = this;
    var u = _self.svg
      .selectAll('circle')
      .data(_self.dataSet)

    u.enter()
      .append('circle')
      .style('cursor', 'pointer')
      .on("mouseover", function (d) {
        _self.tooltip.text("Term Name : " + d.name + ",  Type : " + _self.category[d.category]);
        _self.tooltip.style("visibility", "visible");
      })
      .on("mousemove", function () {
        return _self.tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
      })
      .on("mouseout", function () {
        return _self.tooltip.style("visibility", "hidden");
      })
      .on("click", this.clickHandler)
      .attr('r', function (d) {
        return _self.radius_scale(d.count);
      })
      .attr('fill', function (d) {
        return d.color;
      })
      .merge(u)
      .attr('cx', function (d) {
        return d.x;
      })
      .attr('cy', function (d) {
        return d.y;
      });


    u.exit().remove();
  }


  scaleX() {
    var _self = this;
    var g = _self.svg.append("g");
    var len = _self.category ? (_self.category.length) : 0;

    var x = (_self.width / len) - (_self.gap / len);

    console.log(_self.svg.selectAll('circle'))


    g.selectAll('text')
      .data(_self.category)
      .enter()
      .append('text')
      .attr('y', _self.height)
      .attr('x', function (d, i) {
        return (i * _self.gap);
      })
      .text(function (d) {
        return d;
      })
      .style('fill', 'black');

    g.attr("transform", "translate(" + x + ",-10)");
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

  bindClick(event) {
    this.clickEvent = event;
  }

  clickHandler(d) {
    if (this.clickEvent) {
      this.clickEvent(d);
    }
  }
}

