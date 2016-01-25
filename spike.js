$( document ).ready(function() {
    loadChartForRandori();
});

function elapsedToSeconds(hhmmss) {
    var parts = hhmmss.split(':');
    var hh = parseInt(parts[0]);
    var mm = parseInt(parts[1]);
    var ss = parseInt(parts[2]);
    return ss + mm*60 + hh*3600;
}

function secondsToElapsed(seconds) {
    var hh = Math.floor(seconds/3600);
    var remainder = seconds - hh * 3600;
    var mm = Math.floor(remainder/60);
    var ss = remainder % 60;
    return leftPadZero(hh) + ':' + leftPadZero(mm) + ':' + leftPadZero(ss);
}

function leftPadZero(val) {
    var a = '0' + val;
    return a.substr(a.length-2);
}

function jobExecutorsForBatch(batch) {
    
    return batches.batches[0].jobSteps.map(function(step) {
        return step.host;
    })
    .sort()
    .reduce(function(a,b){
            if (a.slice(-1)[0] !== b) a.push(b);
            return a;
            },[]);
}

function sortAndInsertIdleJobSteps(jobStepsForExecutor) {
    
    jobStepsForExecutor.sort(function(stepA, stepB) {
                             return stepB.startTs - stepA.startTs;
                             });

    var idleSteps = [];
    for(i=1; i<jobStepsForExecutor.length; ++i) {
        var nextJobStart = jobStepsForExecutor[i-1].startTs;
        var previousJobEnd = jobStepsForExecutor[i].endTs;
        if(nextJobStart > previousJobEnd) {
            idleSteps.push({
                           elapsed: secondsToElapsed((nextJobStart - previousJobEnd)/1000),
                           startTs: previousJobEnd,
                           endTs: nextJobStart,
                           jobId: 'Idle'
                           });
        }
    }
    
    return jobStepsForExecutor.concat(idleSteps)
         .sort(function(stepA, stepB) {
            return stepB.startTs - stepA.startTs;
          });

}

function fixJobId(jobId) {
    var parts = jobId.split('-');
    if(parts.length == 1) {
        return jobId;
    }
    var partAfterLastDash = parts[parts.length - 1];
    if (isNaN(partAfterLastDash)) {
        return jobId;
    }
    jobId = jobId.substr(0, jobId.length - partAfterLastDash.length - 1);
    if(jobId[jobId.length - 1] == '-') {
        jobId = jobId.substr(0, jobId.length - 1);
    }
    if(isNaN(parts[0])) {
        return jobId;
    }
    return jobId.substr(parts[0].length+1);
}

function chartExecutor(batch, cssSelector, executorName) {
    var jobStepsForExecutor = batch.jobSteps.filter(function(step) {
        return step.host == executorName;
    });
    
    jobStepsForExecutor.forEach(function(step) {
        step.startTs = new Date(step.start);
        step.endTs = new Date(step.end);
        step.jobId = fixJobId(step.jobId);
    });
    
    jobStepsForExecutor = sortAndInsertIdleJobSteps(jobStepsForExecutor);
    var series = [];
    for(i=0; i<jobStepsForExecutor.length; ++i) {
        var job = {
        name: jobStepsForExecutor[i].jobId,
        data: [elapsedToSeconds(jobStepsForExecutor[i].elapsed)]
        };
        if(job.name == 'Idle') {
            job.color = 'white';
        }
        series.push(job);
    }
    
    $(function () {
      $(cssSelector).highcharts({
                                    chart: {
                                    type: 'bar'
                                    },
                                    title: {
                                    text: ''
                                    },
                                    xAxis: {
                                    categories: [executorName]
                                    },
                                    yAxis: {
                                    labels: {
                                      formatter: function () {
                                       return secondsToElapsed(this.value);
                                      }
                                    },
                                    min: 0,
                                    title: {
                                    text: ''
                                    }
                                    },
                                    legend: {
                                    reversed: true
                                    },
                                tooltip: {
                                formatter: function() {
                                return this.series.name + ' took ' + secondsToElapsed(this.y)
                                }
                                },
                                    plotOptions: {
                                    series: {
                                    stacking: 'normal'
                                    }
                                    },
                                    series: series
                                    }
                                    
                                    
                                )
      }
      );
    
}

function loadChartForRandori() {
    
    var batch = batches.batches[0];
    var jobExecutors = jobExecutorsForBatch(batch);
    chartExecutor(batch, '#JobExecutor1', jobExecutors[0]);
    chartExecutor(batch, '#JobExecutor2', jobExecutors[1]);
    
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
