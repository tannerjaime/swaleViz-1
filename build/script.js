// TO DO:
// improve data snapshot for wind direction (high/low aren't very descriptive/applicable)
// frequent 504 error on retrieving tower data?
// temperature mapping is off (graphing degrees about 20° than they should be)
// is the time axis labeled correctly? according to the numbering along the bottom, it seems most recent values
//   should be to the right. but according to the timestamps, the most recent values are on the left.
// we should reconsider labeling the x-axis with minutes passed——sometimes the tower goes down, and data shown
//   is actually several hours old



var bottomBarTemplate = $('#handlebars-data-bar').html(),
    bottomBarTemplateScript = Handlebars.compile(bottomBarTemplate),
    sidebarTemplate = $('#handlebars-snapshot').html(),
    sidebarTemplateScript = Handlebars.compile(sidebarTemplate);


function updateBottomBar() {
  var bottomBarData = {},
      lastIdx = sensorValues["temperature_f"].length - 1;

  bottomBarData.temperature_f = Math.round(sensorValues["temperature_f"][lastIdx]);
  var tempCels = (sensorValues["temperature_f"][lastIdx] - 32) / 1.8;
  bottomBarData.temperature_c = formatCelsiusTemp(Number(Math.round(tempCels + 'e1') + 'e-1'));
  bottomBarData.windspeed = sensorValues["wind_speed_mph"][lastIdx];
  bottomBarData.pressure = sensorValues["pressure_pa"][lastIdx];
  bottomBarData.rainfall = sensorValues["rain_in"][lastIdx];

  var compiledHTML = bottomBarTemplateScript(bottomBarData);
  $('.data-bar .data').empty();
  $('.data-bar .data').append(compiledHTML);

  // $('#num-minutes').html(sensorValues[yVariable].length);
}

function updateSidebar() {
  var sidebarData = {},
      currentCat = dropdown.elt.value,
      lastIdx = sensorValues[currentCat].length - 1;

  sidebarData.current = sensorValues[currentCat][lastIdx];
  sidebarData.high = Math.max(...sensorValues[currentCat]);
  sidebarData.low = Math.min(...sensorValues[currentCat]);
  sidebarData.unit = optionsInfo[currentCat].unit;

  var compiledHTML = sidebarTemplateScript(sidebarData);
  $('.data-snapshot').empty();
  $('.data-snapshot').append(compiledHTML);

  $('#data-category').html(optionsInfo[currentCat].text);
  $('#data-description').html(optionsInfo[currentCat].description);
}

function formatCelsiusTemp(temp) {
  temp = temp.toString();
  var decimalIndex = temp.indexOf('.');
  return temp.slice(0, decimalIndex) + "<span class='decimal'>" + temp.slice(decimalIndex) + "</span>";
}

var options = ["wind_speed_mph", "temperature_f", "rain_in", "humidity_per", "wind_direction_deg", "pressure_pa", "light_v"],
    towerUrl = 'http://54.235.200.47/tower',
    yVariable = "wind_speed_mph",
    xCoordinates,
    yCoordinates,
    towerData,
    mappedValues,
    sensorValues,
    dropdown,
    title;

var optionsInfo = {
  wind_speed_mph: {
    text: "Wind Speed",
    unit: "MPH",
    description: "There are dozens of us! DOZENS! Dad would stage elaborate situations using a one-armed man to teach us lessons. Could it be love?"
  },
  temperature_f: {
    text: "Temperature (°f)",
    unit: "°F",
    description: "Walter, you can't do that. These guys're like me, they're pacifists. No, Donny, these men are nihilists, there's nothing to be afraid of."
  },
  rain_in: {
    text: "Rain",
    unit: "in",
    description: "A very small stage in a vast cosmic arena the sky calls to us galaxies bits of moving fluff ship of the imagination, kindling the energy hidden in matter."
  },
  humidity_per: {
    text: "Humidity",
    unit: "%",
    description: "A surprise party? Mr. Worf, I hate surprise parties. Some days you get the bear, and some days the bear gets you. Yesterday I did not know how to eat gagh."
  },
  wind_direction_deg: {
    text: "Wind Direction",
    unit: "°",
    description: "Fore heave to boatswain parley nipper capstan bilged on her anchor strike colors ahoy grog. Carouser hearties aft cable splice the main brace Sea Legs warp tack sloop."
  },
  pressure_pa: {
    text: "Pressure",
    unit: "kPa",
    description: "If you spell Chuck Norris in Scrabble, you win. Chuck Norris' hand is the only hand that can beat a Royal Flush. Chuck Norris is the reason why Waldo is hiding."
  },
  light_v: {
    text: "Light",
    unit: "Volts",
    description: "Alright, alright, okay McFly, get a grip on yourself. It's all a dream. Just a very intense dream. He's an absolute dream. You know Marty, you look so familiar, do I know your mother?"
  }
};


function preload() {
  towerData = loadJSON(towerUrl);
}


function setup() {
  drawCanvas();
  update(towerData);
  setEventListeners();

}


function update(weather) {
  clearPresentData();
  saveData(weather);
  updateDataSnapshots();
}


function updateDataSnapshots() {
  updateBottomBar();
  updateSidebar();
}


function drawCanvas() {
  // create graph canvas
  createCanvas(windowWidth, windowHeight * 0.75);
  background(248,252,252);

  // create dropdown menu for data types
  dropdown = createElement('select');
  dropdown.id('yAxis');
  for (var i = 0; i < options.length; i++) {
    var option = createElement('option');
    option.attribute('value', options[i]);
    option.html(optionsInfo[options[i]].text);
    option.parent(dropdown);
  }
  dropdown.position(width * 0.02, height * 0.94);

  // create y-axis label
  var yAxisLabel = createDiv(optionsInfo[dropdown.elt.value].text + " (" + optionsInfo[dropdown.elt.value].unit + ")");
  yAxisLabel.position(width * .15 - 130, height / 2);
  yAxisLabel.style('transform', 'rotate(270deg)');
  yAxisLabel.id("yAxisLabel");

  // create x-axis label
  var xAxisLabel = createDiv("Minutes Passed");
  xAxisLabel.position(width * .41, height * 0.93);
  xAxisLabel.id("xAxisLabel");

  // create title
  title = createDiv("Most Recent Tower Data");
  title.id('title');
  title.position(width * .5 - (textWidth("Tower Data Over The Last 30 Minutes")),  height * 0.14);
}


function clearPresentData() {
  xCoordinates = [];
  yCoordinates = {};
  mappedValues = {};
  sensorValues = {};

  sensorValues["time"] = []; // include timestamps in sensorValues

  for (i = 0; i < options.length; i++) {  // sensorValues = {
    sensorValues[options[i]] = [];        //  temperature_f: [],
    mappedValues[options[i]] = [];        //  wind_speed_mph: [], ...
  }                                       // }
}


function saveData(weather) {
  var xMin = width * 0.15,
      xMax = width * 0.75,
      yMin = height * 0.86,
      yMax = height * 0.26;

  // weather.results returns an array of objects, with each index in the array
  // representing 1 minute and holding all sensor values (rain, temp, etc.) for that minute
  for (var i = 0; i < weather.results.length; i++) {
    // sensorValues restructures the same data into an object where the keys are the data type (rain, temp, etc.),
    // pointing to an array that holds all sensor values in that category from the past however many minutes
    sensorValues.temperature_f.push(Math.round(weather.results[i].temperature_f));
    sensorValues.rain_in.push(weather.results[i].rain_in.toFixed(2));
    sensorValues.humidity_per.push(weather.results[i].humidity_per);
    sensorValues.wind_direction_deg.push(weather.results[i].wind_direction_deg);
    sensorValues.wind_speed_mph.push(weather.results[i].wind_speed_mph.toFixed(1));
    sensorValues.pressure_pa.push((weather.results[i].pressure_pa / 1000).toFixed(1));
    sensorValues.light_v.push(weather.results[i].light_v);
    sensorValues.time.push(weather.results[i].date.split("T")[1].split("-")[0]); // 20:53:01

    // mappedValues contains sensor values mapped to the size of the canvas
    mappedValues.temperature_f.push(map(weather.results[i].temperature_f, 0, 100, yMin, yMax));
    mappedValues.rain_in.push(map(weather.results[i].rain_in, 0, 3, yMin, yMax));
    mappedValues.humidity_per.push(map(weather.results[i].humidity_per, 0, 100, yMin, yMax));
    mappedValues.wind_direction_deg.push(map(weather.results[i].wind_direction_deg, 0, 360, yMin, yMax));
    mappedValues.wind_speed_mph.push(map(weather.results[i].wind_speed_mph, 0, 20, yMin, yMax));
    mappedValues.pressure_pa.push(map(weather.results[i].pressure_pa, 0, 150000, yMin, yMax));
    mappedValues.light_v.push(map(weather.results[i].light_v, 0, 5, yMin, yMax));

    xCoordinates.push(map(i, 0, weather.results.length, xMin, xMax));
  }

  yCoordinates = mappedValues[yVariable];
  drawData();
}


function drawData() {
  // fill(232);
  // stroke(232);
  // rect(0, 0, width, height);
  background(248,252,252);



  drawMajorLines();
  drawXStrokes();
  drawYStrokes();
  drawLineFancy();
}

function drawLine() {

    for (var r = sensorValues.temperature_f.length; r >= 0; r--) {
      stroke(14, 164, 252);
      strokeWeight(4);
      ellipse(xCoordinates[r], yCoordinates[r], 5, 5);
      stroke(14, 164, 252);
      strokeWeight(4);
      line(xCoordinates[r - 1], yCoordinates[r - 1], xCoordinates[r], yCoordinates[r]);
    // ellipse(xCoordinates[r], yCoordinates[r], 5, 5);
    }

}

function drawLineFancy() {
  var r = 0;

  function myLoop () {
     setTimeout(function () {
        stroke(14, 164, 252);
        strokeWeight(4);
        ellipse(xCoordinates[r], yCoordinates[r], 5, 5);
        r++;
        if (r <= sensorValues.temperature_f.length) {
           myLoop();
        } else {
          connect();
        }
     }, 80)
  }

  myLoop(); 

  function connect() {
    for (var r = sensorValues.temperature_f.length; r >= 0; r--) {
      stroke(14, 164, 252);
      strokeWeight(4);
      line(xCoordinates[r - 1], yCoordinates[r - 1], xCoordinates[r], yCoordinates[r]);
    // ellipse(xCoordinates[r], yCoordinates[r], 5, 5);
    }
  }
}


function drawMajorLines() {
  var xMin = width * 0.15,
      xMax = width * 0.75,
      yMin = height * 0.86,
      yMax = height * 0.26;

  stroke(86);
  strokeWeight(2);
  line(xMin, yMin, xMax, yMin);
  line(xMin, yMin,xMin, yMax);
  // dottedLine(xMin, yMin, xMax, yMin, 6, 6, 0, 0.5);
}


function drawXStrokes(Xvalue) {
  var xMin = width * 0.15,
      xMax = width * 0.75,
      yMin = height * 0.86,
      yMax = height * 0.26;

  stroke(86, 86, 86, 100);
  strokeWeight(0.5);
  textFont("Source Code Pro");

  for (var i = mappedValues.temperature_f.length; i >= 0; i--) {
    var x = map(i, mappedValues.temperature_f.length, 0, xMin, xMax);
    // line(x, yMin - 3, x, yMin + 3);
    dottedLine(x, yMin, x, yMax, 1, 3, 200, 1)


    if (i % 2 == 1) {
          textSize(12);
    fill(86);
    strokeWeight(1);
      text(i, x - (textWidth(i) / 2 ), yMin + 20);
    }
  }
}


function drawYStrokes() {
  var xMin = width * 0.15,
      yMin = height * 0.86,
      xMax = width * 0.75,
      yMax = height * 0.26;

  textFont("Source Code Pro");

  function draw(y, z) {
    // stroke(86, 86, 86, 100);
    // strokeWeight(0.25);
    // line(xMin - 3, y, xMax, y);
    dottedLine(xMin - 3, y, xMax, y, 1, 3, 200, 1);
        textSize(12);
    fill(86);
    strokeWeight(1);
    text(z, xMin - 30, y + 5);
  }

  switch (yCoordinates) {
    case mappedValues.temperature_f:
    case mappedValues.humidity_per:
      for (var z = 0; z < 110; z = z + 10) {
        var y = map(z, 0, 100, yMin, yMax);
        draw(y, z);
      }
      break;
    case mappedValues.rain_in:
      for (z = 0; z < 4; z++) {
        y = map(z, 0, 3, yMin, yMax);
        draw(y, z);
      }
      break;
    case mappedValues.wind_speed_mph:
      for (z = 0; z < 21; z++) {
        y = map(z, 0, 20, yMin, yMax);
        draw(y, z);
      }
      break;
    case mappedValues.pressure_pa:
      for (z = 0; z < 150; z = z + 5) {
        y = map(z, 0, 150, yMin, yMax);
        draw(y, z);
      }
      break;
    case mappedValues.light_v:
      for (z = 0; z < 6; z++) {
        y = map(z, 0, 5, yMin, yMax);
        draw(y, z);
      }
      break;
    case mappedValues.wind_direction_deg:
      for (z = 0; z < 370; z= z + 20) {
        y = map(z, 0, 360, yMin, yMax);
        draw(y, z);
      }
      break;
  }
}

function mouseMoved() {
  background(248,252,252);
  drawMajorLines();
  drawXStrokes();
  drawYStrokes();
  drawLine();
  for (var r = sensorValues.temperature_f.length; r >= 0; r--) {
    stroke(14, 164, 252);
    fill(14, 164, 252);
    strokeWeight(2);
    var space = (xCoordinates[r] - xCoordinates[r - 1]) / 2;
    if (mouseX <= xCoordinates[r] + space && mouseX >= xCoordinates[r] - space){
      stroke(50, 100);
      line(xCoordinates[r], yCoordinates[r], xCoordinates[r], height * 0.86);
      line(xCoordinates[r], yCoordinates[r], width * 0.15, yCoordinates[r]);

      stroke(14, 164, 252);
      ellipse(xCoordinates[r], yCoordinates[r], 10, 10);
    }
  }
}

function setEventListeners() {
  $('#yAxis').change(function() {
    yVariable = this.value;
    console.log(this.value + "  " + sensorValues[this.value]);
    yCoordinates = mappedValues[this.value];
    $('#yAxisLabel').html(optionsInfo[this.value].text);
    drawData();
    updateSidebar();
  });

  window.setInterval(function(){
    loadJSON(towerUrl, update);
    drawData();
  }, 60000);
}

function dottedLine(sx, sy, ex, ey, size, space, s, sw) {
  stroke(s);
  strokeWeight(sw);
  fill(0);
  if (sx === ex) {
    var range = dist(sx, sy, ex, ey);
    var iterations = range / (size + space);
    var unit = ((size + space) * 100 / range) / 100;
    for (var i = 0; i <= iterations; i++) {
      var spot = lerp(sy, ey, i * unit);
      // ellipse(spot, sy, size, size);
      line(sx, spot - (size / 2), ex, spot + (size / 2));
    }


  } else if (sy === ey) {
    var range = dist(sx, sy, ex, ey);
    var iterations = range / (size + space);
    var unit = ((size + space) * 100 / range) / 100;
    for (var i = 0; i <= iterations; i++) {
      var spot = lerp(sx, ex, i * unit);
      // ellipse(spot, sy, size, size);
      line(spot - (size / 2), sy, spot + (size / 2), ey);
    }
  }

}
