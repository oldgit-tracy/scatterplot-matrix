var svg_x = 100;
var svg_y = 0;

var width = 960,
    size = 140,
    padding = 0;

var x = d3.scale.linear()
    .range([padding / 2, size - padding / 2]);

var y = d3.scale.linear()
    .range([size - padding / 2, padding / 2]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .ticks(6)
    .tickFormat(function (d) {
          var prefix = d3.formatPrefix(d);
  		if(prefix.symbol == "k"){
  			return prefix.scale(d) + prefix.symbol;
  		}
  		else{
  			return d;
  		}
      });

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(6)
    .tickFormat(function (d) {
          var prefix = d3.formatPrefix(d);
  		if(prefix.symbol == "k"){
  			return prefix.scale(d) + prefix.symbol;
  		}
  		else{
  			return d;
  		}
      });

var color = d3.scale.category10();

d3.csv("mrc_table2.csv", function(error, data) {
  if (error) throw error;

  var exclude = ["name", "tier_name", "state"];
  var tierFilter = ["Nonselective four-year private not-for-profit", "Selective public", "Two-year for-profit"];
  var domainByTrait = {},
      traits = d3.keys(data[0]).filter(function(d) { return !exclude.includes(d); }),
      n = traits.length;


//domain
  data = data.filter(function(d){return tierFilter.includes(d.tier_name);});

  traits.forEach(function(trait) {
    domainByTrait[trait] = d3.extent(data, function(d) { return +d[trait]; });
	domainByTrait[trait][0] *= 0.1;
	domainByTrait[trait][1] *= 1.1;
  });

  console.log(data)
  xAxis.tickSize(size * n);
  yAxis.tickSize(-size * n);

  var brush = d3.svg.brush()
      .x(x)
      .y(y)
      .on("brushstart", brushstart)
      .on("brush", brushmove)
      .on("brushend", brushend);

  var svg = d3.select("body").select("#D3Implementation").append("svg")
      .attr("width", size *2*n + padding)
      .attr("height", size * 2*n + padding)
    .append("g")
      .attr("transform", "translate(" + padding + "," + padding / 2 + ")")
      .attr("transform", "translate(" + svg_x.toString() + ", " + svg_y.toString() + ")");

  svg.selectAll(".x.axis")
      .data(traits)
    .enter().append("g")
      .attr("class", "x axis")
      .attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
      .each(function(d) { x.domain(domainByTrait[d]); d3.select(this).call(xAxis); });

  svg.selectAll(".y.axis")
      .data(traits)
    .enter().append("g")
      .attr("class", "y axis")
      .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
      .each(function(d) { y.domain(domainByTrait[d]); d3.select(this).call(yAxis); });

  var cell = svg.selectAll(".cell")
      .data(cross(traits, traits))
    .enter().append("g")
      .attr("class", "cell")
      .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
      .each(plot);

  // Titles for the yAxis and xAxis.
  // cell.filter(function(d) { return d.j === 0 || d.i === n-1; }).append("text")
  //     .attr("x", padding)
  //     .attr("y", padding)
  //     .attr("dy", ".71em")
  //     .text(function(d) { console.log(d);return d.j === 0? (d.i!==5?d.x:d.x+" / "+d.y) :d.y ;});

      // Titles for the diagonal.
  cell.filter(function(d) { return d.i === d.j; }).append("text")
      .attr("x", padding)
      .attr("y", padding)
      .attr("dy", ".71em")
      .text(function(d) { return d.x; });

  cell.call(brush);

  function plot(p) {
    var cell = d3.select(this);

    x.domain(domainByTrait[p.x]);
    y.domain(domainByTrait[p.y]);

    cell.append("rect")
        .attr("class", "frame")
        .attr("x", padding / 2)
        .attr("y", padding / 2)
        .attr("width", size - padding)
        .attr("height", size - padding);

    cell.selectAll("circle")
        .data(data)
      .enter().append("circle")
        .attr("cx", function(d) { return x(d[p.x]); })
        .attr("cy", function(d) { return y(d[p.y]); })
        .attr("r", 4)

        .style("fill", function(d) { return color(d.tier_name); });
  }

  //legend
  var legend_x = (size + padding) * n + 20;
  var legend_y = 20;

  var legend = svg.append("g");

  legend.attr("transform", "translate(" + legend_x.toString() + ", " + legend_y.toString() + ")");

  //legend title
  legend.append("text")
    .attr("fill", "#000")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("font-weight", "bold")
    .text("Tier name");

  //legend box
  var legendbox_y = 18;
  var legend_square_size = 20;
  var legend_square_gap = 10;

  var legendbox = legend.append("g")
    .attr("transform", "translate(0, " + legendbox_y.toString() + ")")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("g")
    .data(tierFilter)
    .enter().append("g")
    .attr("transform", function(d, i) {
	                       y = i * (legend_square_size + legend_square_gap);
						   return "translate(0," + y.toString() + ")"; });

  //legend rect
  legendbox.append("rect")
    .attr("width", legend_square_size)
    .attr("height", legend_square_size)
    .attr("fill", function(d, i) {
	                  return color(d);
	              });

  //legend text
  var text_x = legend_square_size + 3;
  var text_y = 10;
  legendbox.append("text")
    .attr("x", text_x)
    .attr("y", text_y)
    .text(function(d) { return d; });

  var brushCell;

  // Clear the previously-active brush, if any.
  function brushstart(p) {
    if (brushCell !== this) {
      d3.select(brushCell).call(brush.clear());
      x.domain(domainByTrait[p.x]);
      y.domain(domainByTrait[p.y]);
      brushCell = this;
    }
  }

  // Highlight the selected circles.
  function brushmove(p) {
    var e = brush.extent();
    svg.selectAll("circle").classed("hidden", function(d) {
      return e[0][0] > d[p.x] || d[p.x] > e[1][0]
          || e[0][1] > d[p.y] || d[p.y] > e[1][1];
    });
  }

  // If the brush is empty, select all circles.
  function brushend() {
    if (brush.empty()) svg.selectAll(".hidden").classed("hidden", false);
  }
});

function cross(a, b) {
  var c = [], n = a.length, m = b.length, i, j;
  for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
  return c;
}
