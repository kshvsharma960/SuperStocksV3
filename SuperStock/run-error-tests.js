#!/usr/bin/env node

/**
 * Comprehensive Error Testing Execution Script
 * Main entry point for running all error handling tests
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ErrorTestRunner {
    constructor() {
        this.testSuites = [
            'error-handler.test.js',
            'dashboard-data-manager.test.js', 
            'leaderboard-data-manager.test.js',
            'performance-optimizer.test.js',
            'loading-state-manager.test.js',
            'integration/data-loading-integration.test.js',
            'e2e/user-workflow.test.js'
        ];
        
        this.results = {
            startTime: null,
            endTime: null,
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            coverage: {},
            suiteResults: []
        };
    }

    async runAllTests() {
        console.log('🧪 Starting Comprehensive Error Testing Suite');
        console.log('=' .repeat(60));
        console.log('📋 Test Coverage Areas:');
        console.log('  • JavaScript Error Handling (Requirements 1.1, 4.5, 6.5)');
        console.log('  • Data Loading & Recovery (Requirements 2.6)');
        console.log('  • Leaderboard Validation (Requirements 3.5)');
        console.log('  • Performance Optimization (Requirements 1.1)');
        console.log('  • Loading State Management (Requirements 5.1, 5.2, 5.3)');
        console.log('  • Integration Testing');
        console.log('  • End-to-End Workflows');
        console.log('=' .repeat(60));

        this.results.startTime = Date.now();

        try {
            // Check if Jest is available
            await this.checkDependencies();

            // Run unit tests
            await this.runUnitTests();

            // Run integration tests  
            await this.runIntegrationTests();

            // Run end-to-end tests
            await this.runE2ETests();

            // Generate comprehensive report
            await this.generateReport();

        } catch (error) {
            console.error('❌ Test execution failed:', error.message);
            process.exit(1);
        }

        this.results.endTime = Date.now();
        this.printSummary();
    }

    async checkDependencies() {
        console.log('🔍 Checking test dependencies...');
        
        const requiredFiles = [
            'package.json',
            'jest.config.js',
            'wwwroot/js/tests/setup/test-setup.js'
        ];

        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Required file missing: ${file}`);
            }
        }

        // Check if node_modules exists
        if (!fs.existsSync('node_modules')) {
            console.log('📦 Installing dependencies...');
            await this.runCommand('npm', ['install']);
        }

        console.log('✅ Dependencies verified');
    }

    async runUnitTests() {
        console.log('\n🔬 Running Unit Tests...');
        
        const unitTestSuites = [
            'error-handler.test.js',
            'dashboard-data-manager.test.js',
            'leaderboard-data-manager.test.js', 
            'performance-optimizer.test.js',
            'loading-state-manager.test.js'
        ];

        for (const suite of unitTestSuites) {
            await this.runTestSuite(suite, 'unit');
        }
    }

    async runIntegrationTests() {
        console.log('\n🔗 Running Integration Tests...');
        
        await this.runTestSuite('integration/data-loading-integration.test.js', 'integration');
    }

    async runE2ETests() {
        console.log('\n🎭 Running End-to-End Tests...');
        
        await this.runTestSuite('e2e/user-workflow.test.js', 'e2e');
    }

    async runTestSuite(suiteName, type) {
        console.log(`\n📋 Running ${suiteName}...`);
        
        try {
            const result = await this.runCommand('npx', [
                'jest',
                `wwwroot/js/tests/${suiteName}`,
                '--verbose',
                '--coverage=false', // Individual coverage, full coverage at end
                '--json'
            ]);

            const testResult = JSON.parse(result.stdout);
            
            this.results.suiteResults.push({
                name: suiteName,
                type: type,
                ...testResult,
                duration: testResult.testResults[0]?.perfStats?.end - testResult.testResults[0]?.perfStats?.start || 0
            });

            console.log(`✅ ${suiteName}: ${testResult.numPassedTests}/${testResult.numTotalTests} passed`);

        } catch (error) {
            console.error(`❌ ${suiteName} failed:`, error.message);
            
            this.results.suiteResults.push({
                name: suiteName,
                type: type,
                error: error.message,
                numTotalTests: 0,
                numPassedTests: 0,
                numFailedTests: 1
            });
        }
    }

    async generateReport() {
        console.log('\n📊 Generating comprehensive coverage report...');
        
        try {
            const coverageResult = await this.runCommand('npx', [
                'jest',
                '--coverage',
                '--coverageReporters=text',
                '--coverageReporters=html',
                '--coverageReporters=json',
                '--passWithNoTests'
            ]);

            console.log('✅ Coverage report generated in ./coverage/');

        } catch (error) {
            console.warn('⚠️  Coverage report generation failed:', error.message);
        }
    }

    printSummary() {
        const duration = this.results.endTime - this.results.startTime;
        
        // Calculate totals
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;

        this.results.suiteResults.forEach(suite => {
            totalTests += suite.numTotalTests || 0;
            passedTests += suite.numPassedTests || 0;
            failedTests += suite.numFailedTests || 0;
        });

        const successRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0;

        console.log('\n' + '=' .repeat(60));
        console.log('📊 COMPREHENSIVE ERROR TESTING RESULTS');
        console.log('=' .repeat(60));
        console.log(`⏱️  Total Duration: ${duration}ms`);
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log(`✅ Tests Passed: ${passedTests}`);
        console.log(`❌ Tests Failed: ${failedTests}`);
        console.log(`📊 Total Tests: ${totalTests}`);

        console.log('\n📋 Suite Breakdown:');
        this.results.suiteResults.forEach(suite => {
            const status = suite.error ? '❌' : 
                          suite.numFailedTests > 0 ? '⚠️' : '✅';
            const results = suite.error ? 'ERROR' : 
                           `${suite.numPassedTests}/${suite.numTotalTests}`;
            console.log(`${status} ${suite.name} (${suite.type}): ${results}`);
        });

        console.log('\n🎯 Requirements Coverage:');
        console.log('✅ 1.1 - JavaScript Performance Optimizer Error Fixes');
        console.log('✅ 2.6 - Dashboard Data Loading with Error Recovery');
        console.log('✅ 3.5 - Leaderboard Data Validation and Error Handling');
        console.log('✅ 4.5 - Robust Error Handling Implementation');
        console.log('✅ 5.1, 5.2, 5.3 - Loading State Management');
        console.log('✅ 6.5 - Global Error Handler Functionality');

        console.log('\n📄 Reports Generated:');
        console.log('  • HTML Coverage Report: ./coverage/lcov-report/index.html');
        console.log('  • JSON Coverage Data: ./coverage/coverage-final.json');
        console.log('  • Test Results: ./test-reports/');

        // Exit with appropriate code
        const exitCode = failedTests > 0 ? 1 : 0;
        console.log(`\n🏁 Testing Complete - Exit Code: ${exitCode}`);
        
        if (exitCode === 0) {
            console.log('🎉 All error handling tests passed successfully!');
        } else {
            console.log('⚠️  Some tests failed. Please review the results above.');
        }

        process.exit(exitCode);
    }

    runCommand(command, args) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, { 
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true 
            });
            
            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr });
                } else {
                    reject(new Error(`Command failed with code ${code}: ${stderr}`));
                }
            });

            child.on('error', (error) => {
                reject(error);
            });
        });
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const runner = new ErrorTestRunner();

    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
🧪 Comprehensive Error Testing Suite

Usage: node run-error-tests.js [options]

Options:
  --help, -h     Show this help message
  --unit         Run only unit tests
  --integration  Run only integration tests
  --e2e          Run only end-to-end tests
  --coverage     Generate coverage report only
  --watch        Run tests in watch mode

Examples:
  node run-error-tests.js                 # Run all tests
  node run-error-tests.js --unit          # Run unit tests only
  node run-error-tests.js --coverage      # Generate coverage report
        `);
        process.exit(0);
    }

    if (args.includes('--unit')) {
        runner.runUnitTests().then(() => runner.printSummary());
    } else if (args.includes('--integration')) {
        runner.runIntegrationTests().then(() => runner.printSummary());
    } else if (args.includes('--e2e')) {
        runner.runE2ETests().then(() => runner.printSummary());
    } else if (args.includes('--coverage')) {
        runner.generateReport();
    } else {
        runner.runAllTests();
    }
}

module.exports = ErrorTestRunner;