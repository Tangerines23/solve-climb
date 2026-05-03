import boundaries from 'eslint-plugin-boundaries';
console.log('Boundaries Plugin Keys:', Object.keys(boundaries));
if (boundaries.rules) {
  console.log('Boundaries Rules:', Object.keys(boundaries.rules));
}
