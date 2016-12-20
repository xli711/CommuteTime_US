var censusYear='2013';
var stateCode = 'MA';
var commuteTime = 'B08136_001E';
var commuteTimeAuto = 'B08136_003E'
var population = 'B07410_001E'

var USDataProcessed = false;
var goToCharts = false;

var stateNames;
var commuteTimeData = {};
var commuteTimeAutoData = {};
var populationData = {};
var aCommuteTime = [];

var minTime;
var maxTime;
var totalStates = 0;

var backgroundColor = 230;

var sortMethod = sortByAutoTime;
var reSort = false;
//var icon_private;
//var icon_public;

/*function preload(){
  icon_private = loadImage('data/private.png');
  icon_public = loadImage('data/public.png');
}*/

function setup() {
  createCanvas(960, 540);

  initializeCensus('da4cb3de93f79d31ed9050b5d6264d8e05b67dc1');

  requestUSData(censusYear, commuteTime);
  requestUSData(censusYear, commuteTimeAuto);
  requestUSData(censusYear, population);

  requestStateData(stateCode, censusYear, commuteTimeAuto);
  requestStateData(stateCode, censusYear, population);

  requestStateMap(stateCode);

  countyColor = color(0, 104, 127);
}

function draw() {
  background(backgroundColor);

  overMap.clear(); 
  
  if ((mouseX >= width/2-85 && mouseX <= width/2-10 && mouseY >= 10 && mouseY <= 30)||(mouseX >= width/2+10 && mouseX <= width/2+80 && mouseY >= 10 && mouseY <= 30)||(mouseX >= width-45 && mouseX <= width-15 && mouseY >= 15 && mouseY <= 45)||(mouseX >= width-45 && mouseX <= width-15 && mouseY >= 46 && mouseY <= 95)) {
    cursor(HAND);
  } else {
    cursor(NORMAL);
  }

  // Initial data process
  if (!USDataProcessed && USDataIsReady(censusYear, commuteTime) && USDataIsReady(censusYear, commuteTimeAuto) && USDataIsReady(censusYear, population)) {
    commuteTimeData = getUSData(censusYear, commuteTime);
    commuteTimeAutoData = getUSData(censusYear, commuteTimeAuto);
    populationData = getUSData(censusYear, population);

    stateNames = Object.keys(commuteTimeData);

    for (var idx in stateNames) {
      var dataPoint = {};
      dataPoint.name = stateNames[idx];
      dataPoint.totalTime = commuteTimeData[stateNames[idx]]/populationData[stateNames[idx]];
      dataPoint.autoTime = commuteTimeAutoData[stateNames[idx]]/populationData[stateNames[idx]];
      dataPoint.otherTime = (commuteTimeData[stateNames[idx]] - commuteTimeAutoData[stateNames[idx]])/populationData[stateNames[idx]];
      dataPoint.percentage = commuteTimeAutoData[stateNames[idx]]/commuteTimeData[stateNames[idx]];
      aCommuteTime[idx] = dataPoint;
      
      if((aCommuteTime[idx].otherTime > 0 && aCommuteTime[idx].otherTime < minTime) || minTime == undefined){
         minTime = aCommuteTime[idx].otherTime;
      }

      if(isFinite(aCommuteTime[idx].totalTime) && aCommuteTime[idx].totalTime > maxTime || maxTime == undefined){
       maxTime = aCommuteTime[idx].totalTime;
      }
      
       totalStates++;
    }
    
    aCommuteTime = aCommuteTime.filter(isValid); 
    aCommuteTime.sort(sortMethod);
    
    print(commuteTimeData);
    print(aCommuteTime);
    print(totalStates);
    print(minTime);
    print(maxTime);

    USDataProcessed = true;
  }
    
    if(!goToCharts){
      //title
      textAlign(CENTER, CENTER);
      textSize(20);
      fill(0);
      noStroke();
      text('How Much Does America Rely On\nPrivate Auto Commute?', width/2, height/2);
      if(!USDataProcessed){
        textSize(12);
        textStyle(ITALIC);
        text('Getting Data...', width/2, height/2+60);
      } else{
        textSize(12);
        textStyle(ITALIC);
        text('Data Ready', width/2, height/2+60);
      }
    }

    if(USDataProcessed && goToCharts){
     
     if (reSort){
       aCommuteTime.sort(sortMethod);
     }
      
     //buttons
     noStroke();
     textStyle(NORMAL);
     textAlign(RIGHT, TOP);
     textSize(15);
     if(sortMethod == sortByAutoTime){
       fill(0, 104, 127);
     } else {
       fill(180);
     }
     rect(width/2-85, 10, 75, 20, 5);
     fill(255);
     text('PRIVATE', width/2-16, 12);
     //image(icon_private, 0, 0, icon_private.width, icon_private.height, width/2-40, 15, 20, 20);
     textAlign(LEFT, TOP);
     if(sortMethod == sortByOtherTime){
       fill(0, 104, 127);
     } else {
       fill(180);
     }
     rect(width/2+10, 10, 70, 20, 5);
     fill(255);
     text('PUBLIC', width/2+16, 12);
     
     if(sortMethod == sortByPercentage){
       fill(0, 104, 127);
     } else {
       fill(180);
     }
     ellipse(width-30, 30, 30, 30);
     if(sortMethod == sortByTotalTime){
       fill(0, 104, 127);
     } else {
       fill(180);
     }
     ellipse(width-30, 70, 30, 30);
     fill(255);
     textFont('georgia');
     textStyle(NORMAL);
     textAlign(CENTER, CENTER);
     textSize(20);
     text('%', width-30, 30);
     stroke(255);
     strokeWeight(2);
     noFill();
     line(width-30, 70, width-36, 63);
     line(width-30, 70, width-29, 81);
     
     stateNames = Object.keys(populationData);
   
     noStroke();
     textAlign(LEFT, TOP);
     textSize(10);
     for (var idx in aCommuteTime){
       
       var y = map(idx, 0, aCommuteTime.length, 35, height-5);
       var wCommute = map(aCommuteTime[idx].totalTime, minTime, maxTime, 10, width/2-100);
       var wOther = map(aCommuteTime[idx].otherTime, minTime, maxTime, 10, width/2-100);
       var wAuto = map(aCommuteTime[idx].autoTime, minTime, maxTime, 10, width/2-100);
       if (aCommuteTime[idx].totalTime != 0 && isFinite(aCommuteTime[idx].totalTime)){
         if (mouseX >= width/2-10-wAuto && mouseX <= width/2+10+wOther && mouseY >= y && mouseY <= y+8){
         fill(0, 104, 127);
         rect(width/2-10-wAuto, y, wAuto, 8);
         fill(0, 156, 191);
         rect(width/2+10, y, wOther, 8);
         text(aCommuteTime[idx].name, 20, y-2);
         textAlign(RIGHT, BOTTOM);
         text('all modes: ' + nf(aCommuteTime[idx].totalTime, 1, 2) + 'min\nprivate: ' + nf(aCommuteTime[idx].autoTime, 1, 2)+ 'min, ' + nf(aCommuteTime[idx].percentage*100, 1, 1) +'%\npublic: ' + nf(aCommuteTime[idx].otherTime, 1, 2)+ 'min, ' + nf((1-aCommuteTime[idx].percentage)*100, 1, 1) +'%', width-100, y-16);
         stroke(0, 156, 191);
         strokeWeight(0.5);
         line(10, y+8, width-100, y+8);
         
         
         
         } else{
           noStroke();
           fill(0);
           textAlign(LEFT, TOP);
           rect(width/2-10-wAuto, y, wAuto, 8);
           fill(100);
           rect(width/2+10, y, wOther, 8);
           text(aCommuteTime[idx].name, 20, y-2);
         }   
       }
     }
   }

}   

function isValid(a){
  if (a.totalTime !=0 && isFinite(a.totalTime))
  return a;
}

function sortByTotalTime(a, b){
   if (a.totalTime > b.totalTime) {
    return -1;
  }
  if (a.totalTime < b.totalTime) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

function sortByAutoTime(a, b){
   if (a.autoTime > b.autoTime) {
    return -1;
  }
  if (a.autoTime < b.autoTime) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

function sortByOtherTime(a, b){
   if (a.otherTime > b.otherTime) {
    return -1;
  }
  if (a.otherTime < b.otherTime) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

function sortByPercentage(a, b){
   if (a.percentage > b.percentage) {
    return -1;
  }
  if (a.percentage < b.percentage) {
    return 1;
  }
  // a must be equal to b
  return 0;
}


function mouseClicked() {
  if (!goToCharts){
    goToCharts = true;
  }
  if (mouseX >= width/2-85 && mouseX <= width/2-10 && mouseY >= 10 && mouseY <= 30) {
    sortMethod = sortByAutoTime;
    reSort = true;
  }
  if (mouseX >= width/2+10 && mouseX <= width/2+80 && mouseY >= 10 && mouseY <= 30) {
    sortMethod = sortByOtherTime;
    reSort = true;
  }
  if (mouseX >= width-45 && mouseX <= width-15 && mouseY >= 15 && mouseY <= 45) {
    sortMethod = sortByPercentage;
    reSort = true;
  }
  if (mouseX >= width-45 && mouseX <= width-15 && mouseY >= 46 && mouseY <= 95) {
    sortMethod = sortByTotalTime;
    reSort = true;
  }
}