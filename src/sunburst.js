import * as d3 from 'd3';

export class Sunburst {

  constructor(element, height, width, dataSet = [], category = [], gap = 200) {
    this.element = element; 
    this.dataSet = dataSet;


    this.width = width;
    this.height = height;

  
    this.radius = (Math.min(width, height) / 2) - 10;
    
    this.formatNumber = d3.format(",d");
    
    this.x = d3.scaleLinear()
        .range([0, 2 * Math.PI]);
    
    this.y = d3.scaleSqrt()
        .range([0, this.radius]);
    
    this.color = d3.scaleOrdinal(d3.schemeCategory20);
    
    this.partition = d3.partition();

    this.arc = null;
    this.svg = null;

    //Binding
    this.render = this.render.bind(this);
    this.chart = this.chart.bind(this);
    this.click = this.click.bind(this);
  }


  render() {
    var _self = this;

    d3.select("svg").remove();

    _self.svg = d3.select(_self.element).append("svg")
    .attr("width", _self.width)
    .attr("height", _self.height)
  .append("g")
    .attr("transform", "translate(" + _self.width / 2 + "," + (_self.height / 2) + ")");

    d3.select(self.frameElement).style("height", _self.height + "px");


    _self.arc = d3.arc()
    .startAngle(function(d) {  return Math.max(0, Math.min(2 * Math.PI, _self.x(d.x0))); })
    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, _self.x(d.x1))); })
    .innerRadius(function(d) { return Math.max(0, _self.y(d.y0)); })
    .outerRadius(function(d) { return Math.max(0, _self.y(d.y1)); });

    

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

    var root = d3.hierarchy(_self.dataSet);
    root.sum(function(d) { return d.size; });

    _self.svg.selectAll("path")
        .data(_self.partition(root).descendants())
      .enter().append("path")
        .attr("d",_self.arc)
        .style("fill", function(d) { return _self.color((d.children ? d : d.parent).data.name); })
        .on("click", this.click)
      // .append("title")
      //   .text(function(d) { return d.data.name + "\n" + _self.formatNumber(d.value); })
        .on("mouseover", function (d) {
          _self.tooltip.html('<span class="name">Title: </span><span class="value">' +
          d.data.name +
            '</span><br/>' +
            '<span class="name">Value: </span><span class="value">' +
            d.value +
            '</span>');
          _self.tooltip.style("visibility", "visible");
        })
        .on("mousemove", function () {
          return _self.tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
        })
        .on("mouseout", function () {
          return _self.tooltip.style("visibility", "hidden");
        });

  }

  click(d) {
    
    var _self = this;
    _self.svg.transition()
    .duration(750)
    .tween("scale", function() {
      var xd = d3.interpolate(_self.x.domain(), [d.x0, d.x1]),
          yd = d3.interpolate(_self.y.domain(), [d.y0, 1]),
          yr = d3.interpolate(_self.y.range(), [d.y0 ? 20 : 0, _self.radius]);
      return function(t) { _self.x.domain(xd(t)); _self.y.domain(yd(t)).range(yr(t)); };
    })
  .selectAll("path")
    .attrTween("d", function(d) { return function() { return _self.arc(d); }; });
  }

}

