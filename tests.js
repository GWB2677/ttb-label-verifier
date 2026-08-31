Tests.Js
const fs = require('fs');
const vm = require('vm');

let src = fs
  .readFileSync('app.js', 'utf8')
  .split("document.querySelectorAll")[0];

const ctx = { console };

vm.createContext(ctx);

vm.runInContext(
  src + ';this.evaluate=evaluate;this.WARNING=WARNING;',
  ctx
);

const sample = {
  brand: 'OLD TOM DISTILLERY',
  classType: 'Kentucky Straight Bourbon Whiskey',
  abv: '45%',
  net: '750 mL',
  producer: 'Old Tom Distillery, Louisville, KY',
  imported: false,
  country: ''
};

let r = ctx.evaluate(
  sample,
  `OLD TOM DISTILLERY Kentucky Straight Bourbon Whiskey 45% Alc./Vol. 750 mL Old Tom Distillery, Louisville, KY ${ctx.WARNING}`
);

if (r.overall !== 'pass') {
  throw Error('expected pass');
}

r = ctx.evaluate(
  {
    ...sample,
    abv: '50%'
  },
  `OLD TOM DISTILLERY Kentucky Straight Bourbon Whiskey 45% Alc./Vol. 750 mL Old Tom Distillery, Louisville, KY ${ctx.WARNING}`
);

if (r.overall !== 'fail') {
  throw Error('expected fail');
}

console.log('All verification tests passed.');
 
