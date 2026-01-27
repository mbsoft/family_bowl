/**
 * Script to update README.md with the latest coverage badge
 * Reads coverage data and updates the badge URL in README.md
 * 
 * Usage: node scripts/update-readme-coverage.js
 */

const fs = require('fs');
const path = require('path');

const coverageSummaryPath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
const coverageFinalPath = path.join(__dirname, '..', 'coverage', 'coverage-final.json');
const readmePath = path.join(__dirname, '..', 'README.md');

function getCoveragePercentage() {
  try {
    // Try coverage-summary.json first (Istanbul format)
    if (fs.existsSync(coverageSummaryPath)) {
      const coverageSummary = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
      const totals = coverageSummary.total;
      const overall = (
        totals.lines.pct +
        totals.functions.pct +
        totals.branches.pct +
        totals.statements.pct
      ) / 4;
      return Math.round(overall);
    }
    
    // Try coverage-final.json (v8 format)
    if (fs.existsSync(coverageFinalPath)) {
      const coverageData = JSON.parse(fs.readFileSync(coverageFinalPath, 'utf8'));
      
      let totalStatements = 0, coveredStatements = 0;
      let totalFunctions = 0, coveredFunctions = 0;
      let totalBranches = 0, coveredBranches = 0;
      let totalLines = 0, coveredLines = 0;
      
      for (const filePath in coverageData) {
        const file = coverageData[filePath];
        if (!file || typeof file !== 'object') continue;
        
        const statements = file.s || {};
        const statementCount = Object.keys(statements).length;
        const coveredStatementCount = Object.values(statements).filter(v => v > 0).length;
        totalStatements += statementCount;
        coveredStatements += coveredStatementCount;
        
        const functions = file.f || {};
        const functionCount = Object.keys(functions).length;
        const coveredFunctionCount = Object.values(functions).filter(v => v > 0).length;
        totalFunctions += functionCount;
        coveredFunctions += coveredFunctionCount;
        
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

function updateReadme() {
  const percentage = getCoveragePercentage();
  const color = getColor(percentage);
  const badgeUrl = `https://img.shields.io/badge/coverage-${percentage}%25-${color}`;
  const badgeMarkdown = `[![Coverage](${badgeUrl})](https://github.com/mbsoft/family_bowl)`;

  // Read README
  let readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Replace the coverage badge line
  // Match the pattern: [![Coverage](...)](...)
  const badgePattern = /\[!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/coverage-\d+%25-[a-z]+\)\]\(https:\/\/github\.com\/mbsoft\/family_bowl\)/;
  
  if (badgePattern.test(readmeContent)) {
    readmeContent = readmeContent.replace(badgePattern, badgeMarkdown);
    fs.writeFileSync(readmePath, readmeContent, 'utf8');
    console.log(`✅ Updated README.md with coverage badge: ${percentage}%`);
    console.log(`   Badge: ${badgeMarkdown}`);
  } else {
    console.error('Could not find coverage badge in README.md to update');
    console.error('Expected pattern: [![Coverage](...)](...)');
    process.exit(1);
  }
}

updateReadme();
