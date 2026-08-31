const WARNING =
  'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.';

const $ = id =>
  document.getElementById(id);

let batchRows = [];
let batchEvaluated = [];


function norm(s = '') {

  return String(s)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(
      /[^a-z0-9.%]+/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

}


function words(s = '') {

  return norm(s)
    .split(' ')
    .filter(Boolean);

}


function similarity(a, b) {

  a = words(a);
  b = words(b);

  if (!a.length || !b.length) {
    return 0;
  }

  const A = new Set(a);
  const B = new Set(b);

  let matches = 0;

  A.forEach(word => {

    if (B.has(word)) {
      matches++;
    }

  });

  return (
    2 * matches
  ) / (
    A.size + B.size
  );

}


function extractNumber(s = '') {

  const match =
    String(s).match(
      /\d+(?:\.\d+)?/
    );

  return match
    ? Number(match[0])
    : null;

}


function contains(
  text,
  value
) {

  return (
    value &&
    norm(text).includes(
      norm(value)
    )
  );

}


function check(
  status,
  name,
  detail
) {

  return {
    status,
    name,
    detail
  };

}


function evaluate(
  app,
  text
) {

  const ntext =
    norm(text);

  const checks = [];


  /*
   * BRAND NAME
   */

  const brandSim =
    similarity(
      app.brand,
      text
    );

  checks.push(

    brandSim >= 0.85 ||
    contains(
      text,
      app.brand
    )

      ? check(
          'pass',
          'Brand name',
          'Brand name matches the label.'
        )

      : brandSim >= 0.45

        ? check(
            'review',
            'Brand name',
            'Similar wording found. Human review recommended.'
          )

        : check(
            'fail',
            'Brand name',
            'Expected brand name was not found.'
          )

  );


  /*
   * CLASS OR TYPE
   */

  checks.push(

    contains(
      text,
      app.classType
    )

      ? check(
          'pass',
          'Class / type',
          'Class or type designation found.'
        )

      : check(
          'fail',
          'Class / type',
          'Expected class or type was not found.'
        )

  );


  /*
   * ALCOHOL CONTENT
   */

  const expectedAbv =
    extractNumber(
      app.abv
    );

  const percentages =
    (
      String(text).match(
        /\d+(?:\.\d+)?(?=\s*%)/g
      ) || []
    )
    .map(Number);


  const matchingAbv =
    expectedAbv !== null &&
    percentages.some(
      value =>
        Math.abs(
          value - expectedAbv
        ) < 0.01
    );


  checks.push(

    matchingAbv

      ? check(
          'pass',
          'Alcohol content',
          `Found ${expectedAbv}% ABV.`
        )

      : check(
          'fail',
          'Alcohol content',
          `Expected ${
            app.abv ||
            'an ABV value'
          } was not found.`
        )

  );


  /*
   * NET CONTENTS
   */

  checks.push(

    contains(
      text,
      app.net
    )

      ? check(
          'pass',
          'Net contents',
          'Net contents match.'
        )

      : check(
          'fail',
          'Net contents',
          'Expected net contents were not found.'
        )

  );


  /*
   * PRODUCER / BOTTLER
   */

  checks.push(

    !app.producer

      ? check(
          'review',
          'Producer / bottler',
          'No producer value was supplied in the application.'
        )

      : contains(
          text,
          app.producer
        )

        ? check(
            'pass',
            'Producer / bottler',
            'Producer or bottler information matches.'
          )

        : check(
            'review',
            'Producer / bottler',
            'Exact producer wording was not found. Check label manually.'
          )

  );


  /*
   * COUNTRY OF ORIGIN
   */

  if (app.imported) {

    checks.push(

      app.country &&
      contains(
        text,
        app.country
      )

        ? check(
            'pass',
            'Country of origin',
            'Country of origin found.'
          )

        : check(
            'fail',
            'Country of origin',
            'Imported product requires country of origin.'
          )

    );

  }


  /*
   * GOVERNMENT WARNING
   */

  const warningExact =
    String(text)
      .includes(
        WARNING
      );


  const warningNormalized =
    ntext.includes(
      norm(WARNING)
    );


  checks.push(

    warningExact

      ? check(
          'pass',
          'Government warning',
          'Exact standard warning text found.'
        )

      : warningNormalized

        ? check(
            'review',
            'Government warning',
            'Warning wording appears correct, but capitalization/formatting needs visual review.'
          )

        : check(
            'fail',
            'Government warning',
            'Exact mandatory warning text was not found.'
          )

  );


  /*
   * SCORE
   */

  const weights = {
    pass: 1,
    review: 0.55,
    fail: 0
  };


  const score =
    Math.round(

      checks.reduce(
        (
          total,
          current
        ) =>

          total +
          weights[
            current.status
          ],

        0

      ) /

      checks.length *

      100

    );


  const fails =
    checks.filter(
      item =>
        item.status ===
        'fail'
    ).length;


  const reviews =
    checks.filter(
      item =>
        item.status ===
        'review'
    ).length;


  const overall =
    fails
      ? 'fail'
      : reviews
        ? 'review'
        : 'pass';


  return {

    checks,

    score,

    overall,

    issues:
      checks
        .filter(
          item =>
            item.status !==
            'pass'
        )
        .map(
          item =>
            item.name
        )
        .join('; ')
        || 'None'

  };

}


function formData() {

  return {

    brand:
      $('brand').value,

    classType:
      $('classType').value,

    abv:
      $('abv').value,

    net:
      $('net').value,

    producer:
      $('producer').value,

    imported:
      $('imported').checked,

    country:
      $('country').value

  };

}


function renderResult(
  result,
  milliseconds
) {

  $('results')
    .classList
    .remove('hidden');


  $('score').textContent =
    result.score + '%';


  $('scoreRing').style.borderColor =

    result.overall === 'pass'

      ? '#217a4b'

      : result.overall === 'review'

        ? '#c58b14'

        : '#a33a32';


  $('overallTitle').textContent =

    result.overall === 'pass'

      ? 'Pass — no routine issues found'

      : result.overall === 'review'

        ? 'Review — human judgment needed'

        : 'Issues found — manual review required';


  $('overallText').textContent =

    result.overall === 'pass'

      ? 'All automated checks passed. Final approval remains with the compliance agent.'

      : 'Open the checks below for the specific items that need attention.';


  $('timing').textContent =
    `Completed in ${milliseconds.toFixed(1)} ms`;


  $('checks').innerHTML =

    result.checks

      .map(check => `

        <div class="check">

          <div class="check-top">

            <strong>
              ${check.name}
            </strong>

            <span class="pill ${check.status}">
              ${check.status.toUpperCase()}
            </span>

          </div>
	
          <p>
            ${check.detail}
          </p>

        </div>

      `)

      .join('');

}


function loadSample() {

  $('brand').value =
    'OLD TOM DISTILLERY';

  $('classType').value =
    'Kentucky Straight Bourbon Whiskey';

  $('abv').value =
    '45%';

  $('net').value =
    '750 mL';

  $('producer').value =
    'Old Tom Distillery, Louisville, KY';

  $('imported').checked =
    false;

  $('countryWrap')
    .classList
    .add('hidden');


  $('labelText').value =

`OLD TOM DISTILLERY
Kentucky Straight Bourbon Whiskey
45% Alc./Vol. (90 Proof)
750 mL
Old Tom Distillery, Louisville, KY
${WARNING}`;

}


function clearAll() {

  [
    'brand',
    'classType',
    'abv',
    'net',
    'producer',
    'country',
    'labelText'
  ]

  .forEach(
    id =>
      $(id).value = ''
  );


  $('imported').checked =
    false;


  $('preview')
    .classList
    .add('hidden');


  $('results')
    .classList
    .add('hidden');


  $('timing').textContent =
    '';

}


/*
 * SIMPLE CSV PARSER
 */

function csvParse(s) {

  const rows = [];

  let row = [];
  let field = '';
  let quoteMode = false;


  for (
    let i = 0;
    i < s.length;
    i++
  ) {

    const current =
      s[i];

    const next =
      s[i + 1];


    if (
      current === '"' &&
      quoteMode &&
      next === '"'
    ) {

      field += '"';
      i++;

    }

    else if (
      current === '"'
    ) {

      quoteMode =
        !quoteMode;

    }

    else if (
      current === ',' &&
      !quoteMode
    ) {

      row.push(field);
      field = '';

    }

    else if (
      (
        current === '\n' ||
        current === '\r'
      ) &&
      !quoteMode
    ) {

      if (
        current === '\r' &&
        next === '\n'
      ) {

        i++;

      }


      row.push(field);

      field = '';


      if (
        row.some(
          item =>
            item.trim()
        )
      ) {

        rows.push(row);

      }


      row = [];

    }

    else {

      field += current;

    }

  }


  row.push(field);


  if (
    row.some(
      item =>
        item.trim()
    )
  ) {

    rows.push(row);

  }


  if (
    rows.length < 2
  ) {

    return [];

  }


  const headers =
    rows[0].map(
      value =>
        value.trim()
    );


  return rows
    .slice(1)
    .map(

      row =>

        Object.fromEntries(

          headers.map(

            (
              key,
              index
            ) => [

              key,

              (
                row[index] ||
                ''
              ).trim()

            ]

          )

        )

    );

}


function csvEscape(value) {

  value =
    String(
      value ?? ''
    );


  return /[",\n]/.test(value)

    ? '"' +
      value.replace(
        /"/g,
        '""'
      ) +
      '"'

    : value;

}


function download(
  name,
  text,
  type = 'text/csv'
) {

  const anchor =
    document.createElement(
      'a'
    );


  anchor.href =
    URL.createObjectURL(

      new Blob(
        [text],
        { type }
      )

    );


  anchor.download =
    name;


  anchor.click();


  setTimeout(

    () =>
      URL.revokeObjectURL(
        anchor.href
      ),

    1000

  );

}


function demoBatch() {

  batchRows = [

    {

      brand:
        'OLD TOM DISTILLERY',

      classType:
        'Kentucky Straight Bourbon Whiskey',

      abv:
        '45%',

      net:
        '750 mL',

      producer:
        'Old Tom Distillery, Louisville, KY',

      imported:
        'false',

      country:
        '',

      labelText:
        `OLD TOM DISTILLERY | Kentucky Straight Bourbon Whiskey | 45% Alc./Vol. | 750 mL | Old Tom Distillery, Louisville, KY | ${WARNING}`

    },


    {

      brand:
        "STONE'S THROW",

      classType:
        'American Whiskey',

      abv:
        '40%',

      net:
        '750 mL',

      producer:
        'Stone House Spirits',

      imported:
        'false',

      country:
        '',

      labelText:
        `Stones Throw | American Whiskey | 40% Alc./Vol. | 750 mL | Stone House Spirits | ${WARNING}`

    },


    {

      brand:
        'HARBOR LIGHT',

      classType:
        'Gin',

      abv:
        '42%',

      net:
        '750 mL',

      producer:
        'Harbor Spirits',

      imported:
        'true',

      country:
        'United Kingdom',

      labelText:
        'HARBOR LIGHT | Gin | 40% Alc./Vol. | 750 mL | Harbor Spirits | Product of United Kingdom | Government Warning: please drink responsibly.'

    }

  ];


  alert(
    'Demo batch loaded. Click “Run batch review.”'
  );

}


function runBatch() {

  if (
    !batchRows.length
  ) {

    alert(
      'Upload a CSV or use the demo batch first.'
    );

    return;

  }


  batchEvaluated =

    batchRows.map(

      (
        row,
        index
      ) => {

        const application = {

          ...row,

          imported:
            String(
              row.imported
            )
            .toLowerCase() ===
            'true'

        };


        const result =
          evaluate(
            application,
            row.labelText || ''
          );


        return {

          ...row,

          _r:
            result,

          _i:
            index + 1

        };

      }

    );


  $('batchResults')
    .classList
    .remove('hidden');


  const passes =
    batchEvaluated.filter(
      row =>
        row._r.overall ===
        'pass'
    ).length;


  const reviews =
    batchEvaluated.filter(
      row =>
        row._r.overall ===
        'review'
    ).length;


  const fails =
    batchEvaluated.length -
    passes -
    reviews;


  $('batchSummary').textContent =
    `${batchEvaluated.length} records · ${passes} pass · ${reviews} review · ${fails} fail`;


  $('batchBody').innerHTML =

    batchEvaluated

      .map(row => `

        <tr>

          <td>
            ${row._i}
          </td>

          <td>
            ${row.brand || '—'}
          </td>

          <td>

            <span class="pill ${row._r.overall}">
              ${row._r.overall.toUpperCase()}
            </span>

          </td>

          <td>
            ${row._r.score}%
          </td>

          <td>
            ${row._r.issues}
          </td>

        </tr>

      `)

      .join('');

}


/*
 * TAB BUTTONS
 */

document
  .querySelectorAll(
    '.tab'
  )
  .forEach(

    button =>

      button.onclick =
        () => {

          document
            .querySelectorAll(
              '.tab,.tab-panel'
            )
            .forEach(
              item =>
                item.classList
                  .remove(
                    'active'
                  )
            );


          button.classList
            .add(
              'active'
            );


          $(
            button.dataset.tab
          )
          .classList
          .add(
            'active'
          );

        }

  );


/*
 * IMPORT COUNTRY FIELD
 */

$('imported').onchange =
  () =>

    $('countryWrap')
      .classList
      .toggle(
        'hidden',
        !$('imported').checked
      );


/*
 * BUTTONS
 */

$('sampleBtn').onclick =
  loadSample;


$('clearBtn').onclick =
  clearAll;


$('verifyBtn').onclick =
  () => {

    const start =
      performance.now();


    const result =
      evaluate(
        formData(),
        $('labelText').value
      );


    renderResult(
      result,
      performance.now() -
      start
    );

  };


/*
 * IMAGE PREVIEW
 */

$('imageInput').onchange =
  event => {

    const file =
      event.target.files[0];


    if (file) {

      $('preview').src =
        URL.createObjectURL(
          file
        );


      $('preview')
        .classList
        .remove(
          'hidden'
        );

    }

  };


/*
 * CSV FILE
 */

$('csvInput').onchange =
  async event => {

    const file =
      event.target.files[0];


    if (file) {

      batchRows =
        csvParse(
          await file.text()
        );


      alert(
        `${batchRows.length} rows loaded.`
      );

    }

  };


$('batchSampleBtn').onclick =
  demoBatch;


$('runBatchBtn').onclick =
  runBatch;


$('downloadTemplate').onclick =
  () =>

    download(
      'ttb-labelcheck-template.csv',
      'brand,classType,abv,net,producer,imported,country,labelText\n'
    );


$('downloadResults').onclick =
  () => {

    const header =
      'brand,result,score,issues\n';


    const rows =
      batchEvaluated

        .map(
          row =>

            [
              row.brand,
              row._r.overall,
              row._r.score,
              row._r.issues
            ]

            .map(
              csvEscape
            )

            .join(',')

        )

        .join('\n');


    download(
      'ttb-labelcheck-results.csv',
      header + rows
    );

  };
 
