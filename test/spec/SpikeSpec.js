describe("Spike.js tests", function() {

  it("takes an elapsed time hh:mm:ss string and converts to seconds by calling elapsedToSeconds('01:01:01')", function() {
    
    expect(elapsedToSeconds('01:01:01')).toEqual(3661);
  });
         
  it("takes seconds and converts to an elapsed hh:mm:ss string by calling secondsToElapsed(3661)", function() {
     
     expect(secondsToElapsed(3661)).toEqual('01:01:01');
  });
         
  it("translates JSON date Strings to JS Dates", function() {
     var jsDate = new Date(batches.batches[0].jobSteps[0].start);
     expect(jsDate).toEqual(new Date("Fri Jan 22 2016 01:47:30 GMT-0500 (EST)"));
  });

});
