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

function jobTypesForBatch(batch) {
    
    return batches.batches[0].jobSteps.map(function(step) {
                                           return step.jobType;
                                           })
    .sort()
    .reduce(function(a,b){
            if (a.slice(-1)[0] !== b) a.push(b);
            return a;
            },[]);
}

function colorPalletByJobType(batch) {
    var indexcolors = [
        "#000000", "#FFFF00", "#1CE6FF", "#FF34FF", "#FF4A46", "#008941", "#006FA6", "#A30059",
        "#FFDBE5", "#7A4900", "#0000A6", "#63FFAC", "#B79762", "#004D43", "#8FB0FF", "#997D87",
        "#5A0007", "#809693", "#FEFFE6", "#1B4400", "#4FC601", "#3B5DFF", "#4A3B53", "#FF2F80",
        "#61615A", "#BA0900", "#6B7900", "#00C2A0", "#FFAA92", "#FF90C9", "#B903AA", "#D16100",
        "#DDEFFF", "#000035", "#7B4F4B", "#A1C299", "#300018", "#0AA6D8", "#013349", "#00846F",
        "#372101", "#FFB500", "#C2FFED", "#A079BF", "#CC0744", "#C0B9B2", "#C2FF99", "#001E09",
        "#00489C", "#6F0062", "#0CBD66", "#EEC3FF", "#456D75", "#B77B68", "#7A87A1", "#788D66",
        "#885578", "#FAD09F", "#FF8A9A", "#D157A0", "#BEC459", "#456648", "#0086ED", "#886F4C",
        "#34362D", "#B4A8BD", "#00A6AA", "#452C2C", "#636375", "#A3C8C9", "#FF913F", "#938A81",
        "#575329", "#00FECF", "#B05B6F", "#8CD0FF", "#3B9700", "#04F757", "#C8A1A1", "#1E6E00",
        "#7900D7", "#A77500", "#6367A9", "#A05837", "#6B002C", "#772600", "#D790FF", "#9B9700",
        "#549E79", "#FFF69F", "#201625", "#72418F", "#BC23FF", "#99ADC0", "#3A2465", "#922329",
                                                "#5B4534", "#FDE8DC", "#404E55", "#0089A3", "#CB7E98", "#A4E804", "#324E72", "#6A3A4C"];
    
    var jobTypes = jobTypesForBatch(batch);
    
    var pallet = {Idle: "white"};
    
    for(i=0; i<jobTypes.length; ++i) {
        pallet[jobTypes[i]] = indexcolors[i];
    }
    return pallet;
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
                           jobId: 'Idle',
                           jobType: 'Idle'
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

function chartExecutor(batch, palette, cssSelector, executorName) {
    var jobStepsForExecutor = batch.jobSteps.filter(function(step) {
        return step.host == executorName;
    });
    
    var batchId = "";
    jobStepsForExecutor.forEach(function(step) {
        step.startTs = new Date(step.start);
        step.endTs = new Date(step.end);
        step.jobId = fixJobId(step.jobId);
        batchId = step.batchId;
    });
    
    $(".batchId").text(batchId);
    
    jobStepsForExecutor = sortAndInsertIdleJobSteps(jobStepsForExecutor);
    var series = [];
    for(i=0; i<jobStepsForExecutor.length; ++i) {
        var jobStep = jobStepsForExecutor[i];
        var job = {
        name: jobStep.jobId,
        data: [elapsedToSeconds(jobStep.elapsed)],
        color: palette[jobStep.jobType]
        };
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
    console.log(cssSelector + ' created');
    
}

function loadChartForRandori() {
    
    var batch = batches.batches[0];
    var jobExecutors = jobExecutorsForBatch(batch);
    var pallete = colorPalletByJobType(batch);
    
    for(chartNo=0; chartNo<jobExecutors.length; ++chartNo) {
        chartId = "chart" + chartNo;
        $("body").append('<div id="' + chartId + '" class="chart"></div>');
        chartExecutor(batch, pallete, '#' + chartId, jobExecutors[chartNo]);
        console.log(chartId);
    }
}
