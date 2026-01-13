// WCAG Contrast Ratio Calculator
// WCAG 2.1 AA Requirements:
// - Normal text: 4.5:1
// - Large text (18pt+/14pt+ bold): 3:1
// - UI components/graphics: 3:1

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(...rgb1);
  const l2 = getLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function checkContrast(name, fg, bg, requiredRatio = 4.5) {
  const ratio = getContrastRatio(fg, bg);
  const passes = ratio >= requiredRatio;
  const status = passes ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}: ${ratio.toFixed(2)}:1 (required: ${requiredRatio}:1)`);
  return { name, ratio, requiredRatio, passes };
}

// Light Mode Colors
const lightMode = {
  background: [255, 255, 255],
  foreground: [10, 10, 10],
  card: [255, 255, 255],
  cardForeground: [10, 10, 10],
  primary: [37, 99, 235],
  primaryForeground: [255, 255, 255],
  secondary: [100, 116, 139],
  secondaryForeground: [255, 255, 255],
  accent: [245, 158, 11],
  accentForeground: [10, 10, 10],
  muted: [249, 250, 251],
  mutedForeground: [107, 114, 128],
  border: [100, 116, 139],
  ring: [59, 130, 246]
};

// Dark Mode Colors
const darkMode = {
  background: [10, 10, 10],
  foreground: [250, 250, 250],
  card: [23, 23, 23],
  cardForeground: [250, 250, 250],
  primary: [30, 64, 175],
  primaryForeground: [255, 255, 255],
  secondary: [148, 163, 184],
  secondaryForeground: [10, 10, 10],
  accent: [251, 191, 36],
  accentForeground: [10, 10, 10],
  muted: [39, 39, 42],
  mutedForeground: [161, 161, 170],
  border: [113, 113, 122],
  ring: [59, 130, 246]
};

console.log('\n=== LIGHT MODE CONTRAST VALIDATION ===\n');

const lightResults = [
  checkContrast('Body text (foreground/background)', lightMode.foreground, lightMode.background, 4.5),
  checkContrast('Card text (cardForeground/card)', lightMode.cardForeground, lightMode.card, 4.5),
  checkContrast('Primary button (primaryForeground/primary)', lightMode.primaryForeground, lightMode.primary, 4.5),
  checkContrast('Secondary button (secondaryForeground/secondary)', lightMode.secondaryForeground, lightMode.secondary, 4.5),
  checkContrast('Accent text (accentForeground/accent)', lightMode.accentForeground, lightMode.accent, 4.5),
  checkContrast('Muted text (mutedForeground/muted)', lightMode.mutedForeground, lightMode.muted, 4.5),
  checkContrast('Muted text on background (mutedForeground/background)', lightMode.mutedForeground, lightMode.background, 4.5),
  checkContrast('Border on background (border/background)', lightMode.border, lightMode.background, 3.0),
  checkContrast('Focus ring on background (ring/background)', lightMode.ring, lightMode.background, 3.0)
];

console.log('\n=== DARK MODE CONTRAST VALIDATION ===\n');

const darkResults = [
  checkContrast('Body text (foreground/background)', darkMode.foreground, darkMode.background, 4.5),
  checkContrast('Card text (cardForeground/card)', darkMode.cardForeground, darkMode.card, 4.5),
  checkContrast('Primary button (primaryForeground/primary)', darkMode.primaryForeground, darkMode.primary, 4.5),
  checkContrast('Secondary button (secondaryForeground/secondary)', darkMode.secondaryForeground, darkMode.secondary, 4.5),
  checkContrast('Accent text (accentForeground/accent)', darkMode.accentForeground, darkMode.accent, 4.5),
  checkContrast('Muted text (mutedForeground/muted)', darkMode.mutedForeground, darkMode.muted, 4.5),
  checkContrast('Muted text on background (mutedForeground/background)', darkMode.mutedForeground, darkMode.background, 4.5),
  checkContrast('Border on background (border/background)', darkMode.border, darkMode.background, 3.0),
  checkContrast('Focus ring on background (ring/background)', darkMode.ring, darkMode.background, 3.0)
];

console.log('\n=== SUMMARY ===\n');

const allResults = [...lightResults, ...darkResults];
const totalTests = allResults.length;
const passedTests = allResults.filter(r => r.passes).length;
const failedTests = allResults.filter(r => !r.passes);

console.log(`Total tests: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests.length}`);

if (failedTests.length > 0) {
  console.log('\n❌ FAILED TESTS:');
  failedTests.forEach(({ name, ratio, requiredRatio }) => {
    console.log(`  - ${name}: ${ratio.toFixed(2)}:1 (required: ${requiredRatio}:1)`);
  });
  console.log('\n⚠️  WCAG 2.1 AA compliance: FAILED\n');
  process.exit(1);
} else {
  console.log('\n✅ WCAG 2.1 AA compliance: PASSED\n');
  process.exit(0);
}
