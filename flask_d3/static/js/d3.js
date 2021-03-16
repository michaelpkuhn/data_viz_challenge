// Adapted from: https://observablehq.com/d/cf4a3014579cd894
// Only shows positive values
var div = document.getElementById('chart');

fetch('/json').then(res => res.json()).then(data=> drawChart(div, data))

function drawChart(container, data){
    console.log(data)

    const format = d3.format(",d");
    let height = 924
    let width = 954
    // formats current tree path
    const name = d => d.ancestors().reverse().map(d=>d.data.name).join("/")

    function tile(node, x0, y0, x1, y1) {
        d3.treemapBinary(node, 0, 0, width, height);
        for (const child of node.children) {
          child.x0 = x0 + child.x0 / width * (x1 - x0);
          child.x1 = x0 + child.x1 / width * (x1 - x0);
          child.y0 = y0 + child.y0 / height * (y1 - y0);
          child.y1 = y0 + child.y1 / height * (y1 - y0);
        }
    }
    
    const treemap = data => d3.treemap().tile(tile)
                            (d3.hierarchy(data)
                            .sum(d=> d.value)
                            .sort((a,b) => b.value - a.value))

    const x = d3.scaleLinear().rangeRound([0, width]);
    const y = d3.scaleLinear().rangeRound([0, height]);
    
    // Assigns color based on uid, which is ordered
    // primary, flag-red, gray-light, flag-blue
    const color_list = ["#0071bc","#E4002B","#aeb0b5", "#41B6E6"]
    const pickColor = (uid) => {
        uid_int = uid.split(" ")[0]
        color_int = uid_int % color_list.length
        return color_list[color_int]
    }

    const svg = d3.select(container)
        .append('svg')
        .attr("viewBox", [0.5, -35.5, width, height + 30])
        .style("font", "10px sans-serif");
        
    let group = svg.append("g")
        .call(render, treemap(data));
    
    function render(group, root) {
      const node = group
        .selectAll("g")
        .data(root.children.concat(root))
        .attr("cursor", "pointer")
        .join("g");

      var i = 0;
      const uid_index = () => {i++; return i};
  
      node.filter(d => d === root ? d.parent : d.children)
          .attr("cursor", "pointer")
          .on("click", (event, d) => d === root ? zoomout(root) : zoomin(d));
  
      node.append("title")
          .text(d => `${name(d)}\n${format(d.value)}`);
  
      node.append("rect")
          .attr("id", d => (d.leafUid = uid_index() + " leaf"))
          // root is the current path/back button element
          .attr("fill", d => d === root ? "#fff" : pickColor(d.leafUid))
          .attr("stroke", "#fff");
  
      node.append("text")
        .attr("font-weight", d => d === root ? "bold" : null)
        .selectAll("tspan")
        // formats text
        .data(d => (d === root ? name(d) : d.data.name).split(/(?=[A-z][^A-z /])/g)
                                                        .concat(d.data.level)
                                                        .concat(format(d.value)))
        .join("tspan")
          .attr("x", 3)
          .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
          .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
          .attr("font-weight", (d, i, nodes) => i === nodes.length - 1 ? "normal" : null)
          .text(d => d);
      group.call(position, root);
    }
  
    function position(group, root) {
      group.selectAll("g")
          .attr("transform", d => d === root ? `translate(0,-35)` : `translate(${x(d.x0)},${y(d.y0)})`)
        .select("rect")
          .attr("width", d => d === root ? width : x(d.x1) - x(d.x0))
          .attr("height", d => d === root ? 30 : y(d.y1) - y(d.y0));
    }
  
    // When zooming in, draw the new nodes on top, and fade them in.
    function zoomin(d) {
      console.log(d)
      const group0 = group.attr("pointer-events", "none");
      const group1 = group = svg.append("g").call(render, d);
  
      x.domain([d.x0, d.x1]);
      y.domain([d.y0, d.y1]);
  
      svg.transition()
          .duration(750)
          .call(t => group0.transition(t).remove()
            .call(position, d.parent))
          .call(t => group1.transition(t)
            .attrTween("opacity", () => d3.interpolate(0, 1))
            .call(position, d));
    }
  
    // When zooming out, draw the old nodes on top, and fade them out.
    function zoomout(d) {
      const group0 = group.attr("pointer-events", "none");
      const group1 = group = svg.insert("g", "*").call(render, d.parent);
  
      x.domain([d.parent.x0, d.parent.x1]);
      y.domain([d.parent.y0, d.parent.y1]);
  
      svg.transition()
          .duration(750)
          .call(t => group0.transition(t).remove()
            .attrTween("opacity", () => d3.interpolate(1, 0))
            .call(position, d))
          .call(t => group1.transition(t)
            .call(position, d.parent));
    }
  
}