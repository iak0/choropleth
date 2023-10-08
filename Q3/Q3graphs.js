const GAMES = ['Catan', 'Dominion', 'Codenames', 'Terraforming Mars', 'Gloomhaven', 'Magic: The Gathering', 'Dixit', 'Monopoly'];
const RANKINGS = [0, 2, 3, 4];
const margin = { top: 40, right: 120, bottom: 120, left: 80 };
const width = 1000;
const height = 500;

const chart = (title, id, gameData, yScaling=d3.scaleLinear, showRankings=true) => {
  let xScale = d3.scaleTime()
                 .domain([new Date("2016-11-01"), new Date("2020-09-01")])
                 .range([margin.left, width - margin.right]);
  xScale.tickFormat(3, d3.timeFormat("%b %d"))
  let yScale = yScaling()
                 .domain([yScaling === d3.scaleLog ? 1 : 0, 100000])
                 .range([height - margin.bottom, margin.top]);

  // Draw SVG
  let svg = d3.select("body")
                .insert("svg", "#signature")
                .attr("id", "svg-"+id)
                .attr("viewBox", [0, 0, width, height]);

  // Title
  svg.append("text")
      .attr("id", "title-"+id)
      .attr("x", width/2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("class", "title")
      .text(title);
  
  let plot = svg.append("g")
                .attr("id", "plot-"+id)

  // Lines 
  let line = d3.line()
               .x(d => xScale(d.date))
               .y(d => yScale(d.count));
  
  let lines = plot.append("g")
                  .attr("id", "lines-"+id)
                  .attr("class", "lines");
  
  lines
    .selectAll("path")
    .data(gameData)
    .enter()
    .append("path")
    .attr("d", d => line(d));
  
  lines
    .append("g")
    .selectAll("text")
    .data(gameData)
    .enter()
    .append("text")
    .attr("class", "lineLabel")
    .text((_, i) => GAMES[i])
    .attr("transform", 
          d => `translate(${xScale(d.at(-1).date) + 8},${yScale(d.at(-1).count) + 4})`);
  
  // Axes
  let xAxis = d3.axisBottom(xScale)
                .ticks(d3.utcMonth.every(3))
                .tickFormat(d3.timeFormat("%b %y"));
  let yAxis = d3.axisLeft(yScale)
  
  plot.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .attr("id", "x-axis-"+id)
    .call(xAxis)
    .append("text")
    .attr("x", width/2)
    .attr("y", 40)
    .attr("class", "axisLabel")
    .text("Month");

  plot.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .attr("id", "y-axis-"+id)
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height/3)
    .attr("y", -60)
    .attr("class", "axisLabel")
    .text("Num of Ratings");

  // Ranking bubbles
  if (!showRankings) { return svg; }
  let symbols = plot.append("g")
                    .attr("id", "symbols-"+id)
  let rankings = gameData.filter((_, i) => RANKINGS.indexOf(i) !== -1)
                         .map(row => row.filter((_, i) => (i%3 == 2)));

  rankings.forEach( row => {
    let circleLine = symbols.append("g")
                            .attr("class", "circleLine")
    
    circleLine
      .selectAll("circle")
      .data(row)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.date))
      .attr("cy", d => yScale(d.count))
      .attr("r", 12)
      .attr("class", "circle");

    circleLine
      .selectAll("text")
      .data(row)
      .enter()
      .append("text")
      .attr("x", d => xScale(d.date))
      .attr("y", d => yScale(d.count))
      .attr("class", "circleLabel")
      .attr("alignment-baseline", "middle")
      .text(d => d.rank);
  });

  return svg;
}

const drawGraphs = gameData => {  
  chart("Number of Ratings 2016-2020", 
        "a", gameData, d3.scaleLinear, false);
  chart("Number of Ratings 2016-2020 with Rankings", 
        "b", gameData);
  chart("Number of Ratings 2016-2020 (Square root Scale)",
        "c-1", gameData, d3.scaleSqrt);
  chart("Number of Ratings 2016-2020 (Log Scale)",
        "c-2", gameData, d3.scaleLog); 
}

const timeConv = d3.timeParse("%Y-%m-%d");
d3.csv("boardgame_ratings.csv")
  .then(data => 
    GAMES.map(g => 
      data.map(row => ({
        date: timeConv(row.date),
        count: row[g+"=count"],
        rank: row[g+"=rank"]
      }))
    )
  )
  .then(drawGraphs)
  .catch(error => {
    console.log(error);
  });
