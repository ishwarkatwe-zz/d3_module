import * as d3 from 'd3';

export class BubbleCenter {

  constructor(element, width, height, dataSet = [], category = []) {
    this.element = element;
    this.width = width;
    this.height = height;
    this.dataSet = dataSet;
    this.category = category;

    //Scale
    this.radius_scale = d3.scalePow().exponent(0.5).domain([0,
      d3.max(dataSet, function (d) {
        return d.count;
      })
    ]).range([2, 50]);

    //Elements
    this.svg = '';

    //Binding
    this.render = this.render.bind(this);
    this.simulateFun = this.simulateFun.bind(this);
    this.ticked = this.ticked.bind(this);
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

      this.simulateFun();

      this.tooltipFun();
    } else {
      console.log('error', 'Failed to init D3 module');
    }
  }

  simulateFun() {
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
      })

    u.exit().remove();
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
    if(this.clickEvent){
      this.clickEvent(d);
    }
  }
}

