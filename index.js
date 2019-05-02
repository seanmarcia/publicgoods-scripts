const fs = require('fs');
const glob = require('glob');
const replace = require('replace-in-file');

const SDGS = ['No Poverty',
              'Zero Hunger',
              'Good Health and Well-being',
              'Quality Education',
              'Gender Equality',
              'Clean Water and Sanitation',
              'Affordable and Clean Energy',
              'Decent Work and Economic Growth',
              'Industry, Innovation and Infrastructure',
              'Reduced Inequality',
              'Sustainable Cities and Communities',
              'Responsible Consumption and Production',
              'Climate Action',
              'Life Below Water',
              'Life on Land',
              'Peace and Justice Strong Institutions',
              'Partnerships to achieve the Goal']

path = '../publicgoods-candidates/candidates'
pathHtml = '../publicgoods-website/candidates/index.html';

let candidates=[];

glob(path + '/*.json', {}, (err, files)=>{
  console.log(files);
  for (var i=0; i<files.length; i++) {
    candidates.push(JSON.parse(fs.readFileSync(files[i], 'utf8')));
  }
  console.log(candidates);

  // Initialize SDG array to count occurences in candidates
  let sdgs = new Array(17).fill(0);
  // Initialize type array to count occurences in candidates
  let types = {data:0, software:0, standard:0};
  // Iterate over candidates, and over each nested array and count
  candidates.forEach(function(e) {
    e['SDGs'].forEach(function(d){
      sdgs[d]++;
    })
    e['type'].forEach(function(d){
      types[d]++;
    })
  })

  // Prepare data for chart
  let sdgData = { name: 'SDGs', children: []};
  for(let i=0; i < sdgs.length; i++) {
    if (sdgs[i]) {
      sdgData['children'].push({name: i, value: sdgs[i]});
    }
  }

  // Add total for types to get percentages below
  let t = 0;
  for(var key in types){
    t += types[key];
  }

  // Compute type as percetage
  let type = {};
  for (var key in types) {
    type[key]=Math.round(types[key]/t*100);
  }

  let typeData = [];
  for (var key in types) {
    typeData.push({name: key, value: Math.round(types[key]/t*100) });
  }

let htmlOutput = '<div class="row">';
htmlOutput += '<div class="col-xs-2 col-xs-offset-1"><span class="big-details">'+candidates.length+'</span><span class="small-title">candidates</span></div>'
htmlOutput += '<div class="col-xs-4" id="piechart"></div></div>'
htmlOutput += '<div class="row" style="margin-bottom:5em"><div class="col-xs-10 col-xs-offset-1" id="treemap"><span class="small-title">distribution by SDG</span><div id="treemap"></div></div>';
htmlOutput += '</div>';

htmlOutput += `

<!-- Load d3.js -->
<script src="https://d3js.org/d3.v4.js" charset="utf-8"></script>
<script>

// set the dimensions and margins of the graph
var width = 960, height = 500;

// append the svg object to the body of the page
var svg = d3.select("#treemap")
.append("svg")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", "0 0 1000 300")
`
htmlOutput += 'var data_sdg = '+JSON.stringify(sdgData)+';';
htmlOutput += 'var data_type = '+JSON.stringify(typeData)+';';
htmlOutput += 'var sdg_labels = '+JSON.stringify(SDGS)+';';

htmlOutput += `

  // Give the data to this cluster layout:
  var root = d3.hierarchy(data_sdg).sum(function(d){ return d.value}) // Here the size of each leave is given in the 'value' field in input data

  var tool = d3.select("body").append("div").attr("class", "toolTip");

  // Then d3.treemap computes the position of each element of the hierarchy
  d3.treemap()
    .size([width, height])
    .padding(2)
    (root)

  // use this information to add rectangles:
  svg
    .selectAll("rect")
    .data(root.leaves())
    .enter()
    .append("rect")
      .attr('x', function (d) { return d.x0; })
      .attr('y', function (d) { return d.y0; })
      .attr('width', function (d) { return d.x1 - d.x0; })
      .attr('height', function (d) { return d.y1 - d.y0; })
      .style("stroke", "white")
      .style("fill", "grey")
      .on("mouseover", handleMouseOver)
      .on("mousemove", handleMouseMove)
      .on("mouseout", handleMouseOut);

  // and to add the text labels
  svg
    .selectAll("text")
    .data(root.leaves())
    .enter()
    .append("text")
      .attr("x", function(d){ return d.x0+10})    // +10 to adjust position (more right)
      .attr("y", function(d){ return d.y0+30})    // +20 to adjust position (lower)
      .text(function(d){ return d.data.name })
      .attr("font-size", "30px")
      .attr("fill", "white")

  function handleMouseOver(d) {  // Add interactivity
    // Use D3 to select element, change color and size
    d3.select(this).style('fill','#e91e63');
  }

  function handleMouseMove(d) {
    tool.style("left", d3.event.pageX + 10 + "px")
    tool.style("top", d3.event.pageY - 20 + "px")
    tool.style("display", "inline-block");
    tool.html('SDG '+d.data.name+': '+sdg_labels[d.data.name-1]+'<br/>'+d.data.value+' candidates');
  }

  function handleMouseOut(d, i) {
    // Use D3 to select element, change color back to normal
    d3.select(this).style('fill','grey');

    // Select text by id and then remove
    tool.style("display", "none");
  }

var color = d3.scaleOrdinal()
  .range(['#48b8d0', '#4b5c73', '#e91e63']);


var width = 200,
    height = 200,
    radius = Math.min(width, height) / 2;

var pie = d3.select("#piechart")
  .append("svg")
    .attr('width', '40%')
    .attr('height', '40%')
    .attr('viewBox','0 0 '+Math.min(width,height)+' '+Math.min(width,height))
    .attr('preserveAspectRatio','xMinYMin')
    .style('float', 'left');


var g = pie.append('g')
  .attr('transform', 'translate(' + (width/2) + ',' + (height/2) + ')');

var arc = d3.arc()
  .innerRadius(0)
  .outerRadius(radius);

var pie = d3.pie()
  .value(function(d) { return d.value; })
  .sort(null);

var path = g.selectAll('path')
  .data(pie(data_type))
  .enter()
  .append("g")
  .append('path')
  .attr('d', arc)
  .attr('fill', (d,i) => color(i))
  .style('stroke', 'white')

let legend = d3.select("#piechart").append('div')
      .style('float', 'left')
      .style('margin-left', '5px')
      .append('span')
        .attr('class', 'small-title')
        .text('breakdown by type');

let keys = legend.selectAll('.key')
      .data(data_type)
      .enter().append('div')
      .attr('class', 'key')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('margin-right', '20px');

    keys.append('div')
      .attr('class', 'symbol')
      .style('height', '10px')
      .style('width', '10px')
      .style('margin', '5px 5px')
      .style('background-color', (d, i) => color(i));

    keys.append('div')
      .attr('class', 'name')
      .text(function(d){ return d.name+': '+d.value+'%' });

    keys.exit().remove();


</script>

`

htmlOutput += '<table class="table">';
htmlOutput += '<tr><th>Candidate</th><th>Description</th><th>Type</th><th>SDGs</th><th>License</th></tr>';



  for (var i=0; i<candidates.length; i++) {
    htmlOutput += '<tr>';
    htmlOutput += '<td><a href="'+ candidates[i].website +'" target="_blank">' + candidates[i].name + '</a></td>';
    htmlOutput += '<td>' + candidates[i].description + '</td>';
    htmlOutput += '<td>';
    for (var j=0; j<candidates[i].type.length; j++) {
      htmlOutput += candidates[i].type[j];
      if (j < candidates[i].type.length-1) {
        htmlOutput += ', ';
      }
    }
    htmlOutput += '</td>';
    htmlOutput += '<td>';
    for (var j=0; j<candidates[i].SDGs.length; j++) {
      htmlOutput += '<a href="https://sustainabledevelopment.un.org/sdg'+candidates[i].SDGs[j]+'" target="_blank">';
      htmlOutput += '<img src="/wp-content/uploads/2019/02/SDG'+candidates[i].SDGs[j]+'.png" width="40" alt="'+SDGS[candidates[i].SDGs[j]]+'" class="sdgicon">';
      htmlOutput += '</a>';
    }
    htmlOutput += '</td>';
    htmlOutput += '<td><a href="'+ candidates[i].license_link +'" target="_blank">' + candidates[i].license + '</a></td>';
    htmlOutput += '</tr>';
  }
  htmlOutput += '</table>';
  replace({files: pathHtml, from: '<p>Placeholder</p>', to: htmlOutput}, (error, changedFiles) => {
    if (error) {
      return console.error('Error occurred:', error);
    }
    console.log('Modified files:', changedFiles.join(', '));

    replace({files: pathHtml, from: 'class="col-md-8 page-content-wrap  col-md-offset-2"', to: 'class="col-md-10 page-content-wrap  col-md-offset-1"'}, (error, changedFiles) => {
    if (error) {
      return console.error('Error occurred:', error);
    }
    console.log('Modified files:', changedFiles.join(', '));
  });
  });

})
