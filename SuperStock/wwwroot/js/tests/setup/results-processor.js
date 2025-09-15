/**
 * Test Results Processor
 * Processes and formats test results
 */

module.exports = (results) => {
  const { testResults, numTotalTests, numPassedTests, numFailedTests } = results;
  
  console.log('\n📊 Processing test results...');
  
  // Calculate additional metrics
  const successRate = ((numPassedTests / numTotalTests) * 100).toFixed(2);
  const failureRate = ((numFailedTests / numTotalTests) * 100).toFixed(2);
  
  // Group results by test suite
  const suiteResults = {};
  testResults.forEach(result => {
    const suiteName = result.testFilePath.split('/').pop().replace('.test.js', '');
    suiteResults[suiteName] = {
      numTests: result.numPassingTests + result.numFailingTests,
      passed: result.numPassingTests,
      failed: result.numFailingTests,
      duration: result.perfStats.end - result.perfStats.start
    };
  });
  
  // Enhanced results object
  const enhancedResults = {
    ...results,
    metrics: {
      successRate: parseFloat(successRate),
      failureRate: parseFloat(failureRate),
      totalDuration: testResults.reduce((sum, result) => 
        sum + (result.perfStats.end - result.perfStats.start), 0
      ),
      averageTestDuration: testResults.length > 0 ? 
        testResults.reduce((sum, result) => 
          sum + (result.perfStats.end - result.perfStats.start), 0
        ) / testResults.length : 0
    },
    suiteResults,
    timestamp: new Date().toISOString()
  };
  
  // Log summary
  console.log(`✅ Success Rate: ${successRate}%`);
  console.log(`❌ Failure Rate: ${failureRate}%`);
  console.log(`⏱️  Total Duration: ${enhancedResults.metrics.totalDuration}ms`);
  
  return enhancedResults;
};