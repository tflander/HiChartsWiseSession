$( document ).ready(function() {
    // loadDemoChart();  // TODO: remove this chart
    loadChartForRandori();  // TODO: this currently does nothing
});

// function to convert elapsed time as a string "HH:MM:SS" to a number in seconds
// Use this for the "elapsed" field in the jobsteps object:
//    batches.batches[0].jobSteps[0].elapsed
function elapsedToSeconds(hhmmss) {
    var parts = hhmmss.split(':');
    var hh = parseInt(parts[0]);
    var mm = parseInt(parts[1]);
    var ss = parseInt(parts[2]);
    return ss + mm*60 + hh*3600;
}

// function to convert seconds to an elapsed time string "HH:MM:SS"
// I don't know if this will be useful
function secondsToElapsed(seconds) {
    var hh = Math.floor(seconds/3600);
    var remainder = seconds - hh * 3600;
    var mm = Math.floor(remainder/60);
    var ss = remainder % 60;
    return leftPadZero(hh) + ':' + leftPadZero(mm) + ':' + leftPadZero(ss);
}

// TIP:  you can easily create a javascript date from the date strings in the
//  JSON batches object.  For example:
//    new Date(batches.batches[0].jobSteps[0].start)

function leftPadZero(val) {
    var a = '0' + val;
    return a.substr(a.length-2);
}

function minToHhMm(val) {
    return leftPadZero(Math.floor(val/60)) + ':' + leftPadZero(val % 60)
}


// TODO:  we won't use this for spiking.  We want to use the batches variable
function generateBatches(numBatches) {
    var batches = [];
    
    var predictionWithoutRestart = 110;
    var predictionWithRestart = predictionWithoutRestart + 20;
    var maxVarianceWithoutRestart = 20;
    var maxVarianceForRestart = 10;
    
    for(i = 0; i < numBatches; ++i) {
        timeWithoutRestart = predictionWithoutRestart + Math.floor((Math.random() * maxVarianceWithoutRestart) - maxVarianceWithoutRestart/2);
        timeWithRestart = timeWithoutRestart + 20 + + Math.floor(Math.random() * maxVarianceForRestart);
        batches.push({
                     batchId: (i+1234) + "-C",
                     predictionWithRestart: predictionWithRestart,
                     predictionWithoutRestart: predictionWithoutRestart,
                     timeWithoutRestart: timeWithoutRestart,
                     timeWithRestart: timeWithRestart
                     });
    };
    return batches;
}

function loadChartForRandori() {
    var finalMergeP1 = [];
    batches.batches.forEach(function (batch){
        batch.jobSteps.forEach(function(step) {

            if(typeof step.jobId !== 'undefined' && step.jobId.startsWith("FINAL_MERGE-P1-")) {
               finalMergeP1.push(step);
            }
        });
    });
    
    var categories = [];
    var series = [];
    var apTimes = [];
    var contentTimes = [];
    
    finalMergeP1.forEach(function(mergeStep) {
        categories.push(mergeStep.batchId);
        if(mergeStep.batchId.endsWith("A") || mergeStep.batchId.endsWith("P")) {
            apTimes.push(elapsedToSeconds(mergeStep.elapsed));
            contentTimes.push(null);
        } else {
            contentTimes.push(elapsedToSeconds(mergeStep.elapsed));
            apTimes.push(null);
        }
    });
    
    $('#container').highcharts({
                               title: {
                               text: 'P1 Final Merge Time Trend',
                               x: -20 //center
                               },
                               
                               tooltip: {
                               formatter: function() {
                               return 'P1 Final Merge time for batch ' + this.x + ' is ' + secondsToElapsed(this.y);
                               }
                               },
                               
                               
                               xAxis: {
                               categories: categories.reverse()
                               },
                               yAxis: {
                               title: {
                               text: 'Time (HH:MM:SS)'
                               },
                               labels: {
                               formatter: function() {
                               return secondsToElapsed(this.value);
                               }

                               
                               },
                               plotLines: [{
                                           value: 0,
                                           width: 1,
                                           color: '#808080'
                                           }]
                               },
                               legend: {
                               layout: 'vertical',
                               align: 'right',
                               verticalAlign: 'middle',
                               borderWidth: 0
                               },
                               series: [{
                               name: 'Time for Content Batches',
                               data: contentTimes.reverse()
                               },
                                        {
                                        name: 'Time for AP Batches',
                                        data: apTimes.reverse()
                                        }
                               ]
                               });
    
    console.log(categories);
    console.log(times);
    
    
}

// TODO: we want to replace this chart with our own.
function loadDemoChart() {
    
    var batches = generateBatches(50);
    
    var categories = [];
    var series = [];
    var timesNotIncludingRestart = [];
    var timesIncludingRestart = [];
    var predictedTimeWithRestart = [];
    
    for(i=0; i<batches.length; ++i) {
        timesNotIncludingRestart.push(batches[i].timeWithoutRestart);
        timesIncludingRestart.push(batches[i].timeWithRestart);
        predictedTimeWithRestart.push(batches[i].predictionWithRestart);
        categories.push(batches[i].batchId);
    };
    
    series.push({
                name: 'Time With Restart',
                data:  timesIncludingRestart
                });
    series.push({
                name: 'Time Not Including Restart',
                data:  timesNotIncludingRestart
                });
    series.push({
                name: 'Predicted Time With Restart',
                data: predictedTimeWithRestart
                });
    
    $('#container').highcharts({
                               plotOptions: {
                               series: {
                               cursor: 'pointer',
                               point: {
                               events: {
                               click: function () {
                               alert(this.series.name + ' for batch ' + this.category + ', value: ' + this.y);
                               }
                               }
                               }
                               }
                               },
                               title: {
                               text: 'Workflow Batch Archive History',
                               x: -20 //center
                               },
                               subtitle: {
                               text: 'Last 50 Batches',
                               x: -20
                               },
                               tooltip: {
                               formatter: function() {
                               return this.series.name + ' for batch ' + this.x + ' is ' + minToHhMm(this.y);
                               }
                               },
                               xAxis: {
                               categories: categories
                               },
                               yAxis: {
                               title: {
                               text: 'Time (HH:MM)'
                               },
                               
                               labels: {
                               formatter: function() {
                               return minToHhMm(this.value);
                               }
                               },
                               
                               
                               plotLines: [{
                                           value: 0,
                                           width: 1,
                                           color: '#808080'
                                           }]
                               },
                               legend: {
                               layout: 'vertical',
                               align: 'right',
                               verticalAlign: 'middle',
                               borderWidth: 0
                               },
                               series: series
                               });
}
