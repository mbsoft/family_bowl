/**
 * Script to generate a coverage badge for the README
 * Reads coverage summary from coverage/coverage-summary.json
 * and generates a badge URL using shields.io
 * 
 * Usage: node scripts/generate-coverage-badge.js
 */

const fs = require('fs');
const path = require('path');

const coverageSummaryPath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
const coverageFinalPath = path.join(__dirname, '..', 'coverage', 'coverage-final.json');

function getCoveragePercentage() {
  try {
    // Try coverage-summary.json first (Istanbul format)
    if (fs.existsSync(coverageSummaryPath)) {
      const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
      const totals = coverageSummary.total;

    // Calculate overall coverage (average of lines, functions, branches, statements)
    const overall = (
      totals.lines.pct +
      totals.functions.pct +
      totals.branches.pct +
      totals.statements.pct
    ) / 4;

      return Math.round(overall);
    }
    
    // Try coverage-final.json (v8 format)
    // v8 format stores per-file data, we need to calculate totals
    if (fs.existsSync(coverageFinalPath)) {
      const coverageData = JSON.parse(fs.readFileSync(coverageFinalPath, 'utf8'));
      
      // Calculate totals from all files
      let totalStatements = 0, coveredStatements = 0;
      let totalFunctions = 0, coveredFunctions = 0;
      let totalBranches = 0, coveredBranches = 0;
      let totalLines = 0, coveredLines = 0;
      
      for (const filePath in coverageData) {
        const file = coverageData[filePath];
        if (!file || typeof file !== 'object') continue;
        
        // Count statements
        const statements = file.s || {};
        const statementCount = Object.keys(statements).length;
        const coveredStatementCount = Object.values(statements).filter(v => v > 0).length;
        totalStatements += statementCount;
        coveredStatements += coveredStatementCount;
        
        // Count functions
        const functions = file.f || {};
        const functionCount = Object.keys(functions).length;
        const coveredFunctionCount = Object.values(functions).filter(v => v > 0).length;
        totalFunctions += functionCount;
        coveredFunctions += coveredFunctionCount;
        
        // Count branches
        const branches = file.b || {};
        let branchCount = 0, coveredBranchCount = 0;
        for (const branchKey in branches) {
          const branchHits = branches[branchKey];
          if (Array.isArray(branchHits)) {
            branchCount += branchHits.length;
            coveredBranchCount += branchHits.filter(h => h > 0).length;
          }
        }
        totalBranches += branchCount;
        coveredBranches += coveredBranchCount;
        
        // Lines are same as statements for v8
        totalLines += statementCount;
        coveredLines += coveredStatementCount;
      }
      
      if (totalStatements > 0) {
        const statementsPct = (coveredStatements / totalStatements) * 100;
        const functionsPct = totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0;
        const branchesPct = totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0;
        const linesPct = (coveredLines / totalLines) * 100;
        
        const overall = (statementsPct + functionsPct + branchesPct + linesPct) / 4;
        return Math.round(overall);
      }
    }
    
    console.error('Coverage summary not found. Run "npm run test:coverage" first.');
    console.error('Expected files: coverage/coverage-summary.json or coverage/coverage-final.json');
    process.exit(1);
  } catch (error) {
    console.error('Error reading coverage summary:', error);
    process.exit(1);
  }
}

function getColor(percentage) {
  if (percentage >= 80) return 'brightgreen';
  if (percentage >= 60) return 'green';
  if (percentage >= 40) return 'yellow';
  if (percentage >= 20) return 'orange';
  return 'red';
}

const percentage = getCoveragePercentage();
const color = getColor(percentage);

// Generate shields.io badge URL
const badgeUrl = `https://img.shields.io/badge/coverage-${percentage}%25-${color}`;

console.log('\n📊 Test Coverage Badge:');
console.log(`![Coverage](${badgeUrl})`);
console.log('\nAdd this to your README.md:');
console.log(`![Coverage](${badgeUrl})`);
console.log('\nOr use the markdown format:');
console.log(`[![Coverage](${badgeUrl})](https://github.com/mbsoft/family_bowl)`);

// Also output JSON for programmatic use
console.log('\nJSON format:');
console.log(JSON.stringify({
  percentage,
  color,
  badgeUrl,
  markdown: `![Coverage](${badgeUrl})`
}, null, 2));
