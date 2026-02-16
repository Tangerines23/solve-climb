import { readFileSync } from 'fs';

const reportPath = './lighthouse-report.json';
const data = JSON.parse(readFileSync(reportPath, 'utf8'));

console.log('=== PERFORMANCE ===');
console.log('LCP:', data.audits['largest-contentful-paint']?.displayValue);
const lcpAudit = data.audits['largest-contentful-paint-element'];
const lcpItem = lcpAudit?.details?.items?.[0];
if (lcpItem && lcpItem.node) {
  console.log('LCP Element:', lcpItem.node.nodeLabel || 'No Label');
  console.log('LCP Element Snippet:', lcpItem.node.snippet || 'No Snippet');
} else {
  console.log('LCP Element information not found in details.');
}

console.log('\n=== ACCESSIBILITY (Color Contrast) ===');
const ccAudit = data.audits['color-contrast'];
const cc = ccAudit?.details?.items || [];
console.log(`Found ${cc.length} violations:`);
cc.forEach((item, i) => {
  if (item.node) {
    console.log(`${i + 1}. [${item.node.nodeLabel || 'No Label'}]`);
    console.log(`   Snippet: ${item.node.snippet || 'No Snippet'}`);
    console.log(
      `   Ratio: ${item.contrastRatio?.toFixed(2)} (Expected: ${item.threshold?.toFixed(2)})`
    );
  }
});

console.log('\n=== RENDER BLOCKING ===');
const rbAudit = data.audits['render-blocking-resources'];
const rb = rbAudit?.details?.items || [];
rb.forEach((item) => {
  console.log(`- ${item.url} (Wasted: ${item.wastedMs}ms)`);
});

console.log('\n=== UNUSED CSS ===');
const ucAudit = data.audits['unused-css-rules'];
const uc = ucAudit?.details?.items || [];
uc.forEach((item) => {
  console.log(`- ${item.url} (Savings: ${item.wastedBytes} bytes)`);
});
