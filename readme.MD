HighCharts Randori for Ocean WISE
-----
The purpose of this WISE session is to take a look at HighCharts, and to brainstorm and randori on how we can use them for charting Ocean Workflow Job Steps.

I've created a JSON object that details job steps across several batches.  Let's decide how we want to slice and display this data.

Take a look at the HighCharts Demo Page:  http://www.highcharts.com/demo

Take a look at the demo spike.html page.
  - Note that the demo graph uses generated data.  We want to create a brand new graph using real data.
  - Open up the JavaScript console and take a look at the batches object.  Think about the data we have and don't have.  What would be useful to show based on the data we have?  What should be easy to put together in an hour or less?  Note that we don't have the data to reproduce the Workflow Batch Archive History chart.
  - Consider finishing the branch 'executorSpike', which demos how we can chart out tasks by Job Executor for a branch.
  - Look at the source spike.js.  Observe the general flow, plus the helper functions that you can use to build a graph.
  - Run the Jasmine tests and look at SpikeSpec.js to verify the helper functions
  - Design and code a chart while having fun.