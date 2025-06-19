type Mark = {
  center: [number, number];
  label: string;
  labelVariant: 'city' | 'country' | 'sea';
  markVariant: 'none' | 'dot' | 'strike';
};

type BBox = [[number, number], [number, number], [number, number], [number, number]];

type Marker = {
  bbox: BBox;
  highlights: string[]; // country codes
  marks: Mark[];
};

// Bounding boxes of each view. Re-used multiple times across the set of markers
const BBOX = {
  middleEast: [
    [26.950210183782474, 43.34444339352575],
    [26.950210183782474, 20.435068684928638],
    [71.6046864673898, 20.435068684928638],
    [71.6046864673898, 43.34444339352575]
  ] as BBox,
  middleEastWider: [
    [27.25120971638492, 40.47022089200098],
    [27.25120971638492, 9.419896377564726],
    [68.64247427157355, 9.419896377564726],
    [68.64247427157355, 40.47022089200098]
  ] as BBox,
  israelPalestine: [
    [31.389178943158527, 36.21646691830993],
    [31.389178943158527, 28.840682701979517],
    [39.633082257055065, 28.840682701979517],
    [39.633082257055065, 36.21646691830993]
  ] as BBox,
  syria: [
    [31.689737918144147, 38.56989682734587],
    [31.689737918144147, 27.934122720381524],
    [46.41712769244947, 27.934122720381524],
    [46.41712769244947, 38.56989682734587]
  ] as BBox,
  yemen: [
    [40.002721063740495, 21.07294310861458],
    [40.002721063740495, 10.555606086151954],
    [57.5210156057702, 10.555606086151954],
    [57.5210156057702, 21.07294310861458]
  ] as BBox,
  iran: [
    [39.617064687229714, 41.3141077954528],
    [39.617064687229714, 22.196126423716166],
    [67.8696083358964, 22.196126423716166],
    [67.8696083358964, 41.3141077954528]
  ] as BBox,

  russia: [
    [2.315274354114962, 76.68952742364081],
    [2.315274354114962, 23.734305017653995],
    [190.437170787571, 23.734305017653995],
    [190.437170787571, 76.68952742364081]
  ] as BBox,

  china: [
    [64.91718274709623, 56.79779017394327],
    [64.91718274709623, 13.87253198981702],
    [149.96725021029016, 13.87253198981702],
    [149.96725021029016, 56.79779017394327]
  ] as BBox,

  us: [
    [-135.4451721160103, 52.128284229162205],
    [-135.4451721160103, 17.69174400440663],
    [-57.66704350654733, 17.69174400440663],
    [-57.66704350654733, 52.128284229162205]
  ] as BBox
};

const COUNTRY_LABELS = {
  israel: {
    center: [34.80789466864397, 31.77585694846691],
    label: 'Israel',
    labelVariant: 'country',
    markVariant: 'none'
  } as Mark,
  iran: {
    center: [53.99194615403175, 33.549571719171794],
    label: 'Iran',
    labelVariant: 'country',
    markVariant: 'none'
  } as Mark,
  gaza: {
    center: [34.3840523250353, 31.449685955418218],
    label: 'Gaza',
    labelVariant: 'country',
    markVariant: 'none'
  } as Mark,
  westBank: {
    center: [35.27869658593059, 32.2544390687239],
    label: 'West Bank',
    labelVariant: 'country',
    markVariant: 'none'
  } as Mark,
  lebanon: {
    center: [36.08896444166055, 34.20363012231529],
    label: 'Lebanon',
    labelVariant: 'country',
    markVariant: 'none'
  } as Mark,
  syria: {
    center: [38.47117881843772, 34.84728007303045],
    label: 'Syria',
    labelVariant: 'country',
    markVariant: 'none'
  } as Mark,
  saudiArabia: {
    center: [42.06433636388732, 25.239791126859572],
    label: 'Saudi Arabia',
    labelVariant: 'country',
    markVariant: 'none'
  } as Mark,
  yemen: {
    center: [49.65370221145258, 20.860719553633174],
    label: 'Yemen',
    labelVariant: 'country',
    markVariant: 'none'
  } as Mark,
  russia: {
    center: [76.27440698248733, 63.46271799275593],
    label: 'Russia',
    labelVariant: 'country',
    markVariant: 'none'
  } as Mark,
  china: {
    center: [97.1131265294776, 34.2934365447086],
    label: 'China',
    labelVariant: 'country',
    markVariant: 'none'
  } as Mark,
  us: {
    center: [-103.3295441731998, 38.78455886002209],
    label: 'United States',
    labelVariant: 'country',
    markVariant: 'none'
  } as Mark
};

const CITY_LABELS = {
  telAviv: {
    center: [34.78577100552596, 32.091771978557844],
    label: 'Tel Aviv',
    labelVariant: 'city',
    markVariant: 'dot'
  } as Mark,
  tehran: {
    center: [51.36813962138109, 35.70238478913372],
    label: 'Tehran',
    labelVariant: 'city',
    markVariant: 'dot'
  } as Mark,
  beirut: {
    center: [35.48469163934104, 33.900918069625234],
    label: 'Beirut',
    labelVariant: 'city',
    markVariant: 'dot'
  } as Mark,
  damascus: {
    center: [36.30575054211161, 33.513047247553146],
    label: 'Damascus',
    labelVariant: 'city',
    markVariant: 'dot'
  } as Mark,
  sanaa: {
    center: [44.19843305357395, 15.3416817915042],
    label: "S'anaa",
    labelVariant: 'city',
    markVariant: 'dot'
  } as Mark,
  moscow: {
    center: [37.70195666033055, 55.75572025579794],
    label: 'Moscow',
    labelVariant: 'city',
    markVariant: 'dot'
  } as Mark,
  beijing: {
    center: [116.38285828328128, 39.88046215316737],
    label: 'Beijing',
    labelVariant: 'city',
    markVariant: 'dot'
  } as Mark,
  washington: {
    center: [-77.07148562066993, 38.88601799872134],
    label: 'Washington, DC',
    labelVariant: 'city',
    markVariant: 'dot'
  } as Mark
};

export const markers: Marker[] = [
  //
  // IRANIAN ALLIES
  //

  //<< enter full-screen map; Israel and Iran are highlighted countries and labelled; depending on space and zoom level also label (but don’t highlight) Iraq and Syria >>
  {
    bbox: BBOX.middleEast,
    highlights: ['IL', 'IR'],
    marks: [COUNTRY_LABELS.israel, COUNTRY_LABELS.iran, CITY_LABELS.telAviv, CITY_LABELS.tehran]
  },

  // << map changes to centre on Israel and zoom in closer (if higher zoom level looks okay?); Israel remains highlighted and labelled; remove highlight and label from Iran (won’t be visible anyway) >>
  {
    bbox: BBOX.israelPalestine,
    highlights: ['IL'],
    marks: [COUNTRY_LABELS.israel, CITY_LABELS.telAviv]
  },

  // << add highlight and label to Gaza Strip  >>
  {
    bbox: BBOX.israelPalestine,
    highlights: ['GZ'],
    marks: [COUNTRY_LABELS.israel, COUNTRY_LABELS.gaza]
  },

  // << add highlight and label to West Bank >>
  {
    bbox: BBOX.israelPalestine,
    highlights: ['GZ', 'WB'],
    marks: [COUNTRY_LABELS.israel, CITY_LABELS.telAviv, COUNTRY_LABELS.gaza, COUNTRY_LABELS.westBank]
  },

  // << zoom out and centre map on Lebanon; keep Israel within the frame; add highlight and label to Lebanon; add marker for Beirut; remove labels from Gaza Strip and West Bank >>
  {
    bbox: BBOX.israelPalestine,
    highlights: ['LB'],
    marks: [COUNTRY_LABELS.israel, COUNTRY_LABELS.lebanon, CITY_LABELS.beirut]
  },

  // << zoom out and centre map on Syria; keep Israel within the frame; add highlight and label to Syria; add marker for Damascus; remove marker for Beirut; keep label for Syria (if spacing allows) >>
  {
    bbox: BBOX.syria,
    highlights: ['SY'],
    marks: [COUNTRY_LABELS.israel, COUNTRY_LABELS.lebanon, COUNTRY_LABELS.syria, CITY_LABELS.damascus]
  },

  // << stay at same zoom level but move Yemen to centre of frame; add label and highlight to Yemen; add marker for Sanaa; include label for Saudi Arabia if possible >>
  {
    bbox: BBOX.yemen,
    highlights: ['YE'],
    marks: [COUNTRY_LABELS.yemen, COUNTRY_LABELS.saudiArabia, CITY_LABELS.sanaa]
  },

  // << zoom out a bit and move back to centreing on Israel and Iran; highlights and labels on Israel, Iran, Syria, Lebanon, Yemen; Saudi Arabia also labelled if it fits >>
  {
    bbox: BBOX.middleEastWider,
    highlights: ['IL', 'IR', 'SY', 'LB', 'YE'],
    marks: [
      COUNTRY_LABELS.israel,
      COUNTRY_LABELS.iran,
      COUNTRY_LABELS.syria,
      COUNTRY_LABELS.lebanon,
      COUNTRY_LABELS.yemen,
      COUNTRY_LABELS.saudiArabia
    ]
  },

  // << zoom into Iran and remove all other labels and highlights >>
  {
    bbox: BBOX.iran,
    highlights: ['IR'],
    marks: [COUNTRY_LABELS.iran, CITY_LABELS.tehran]
  },

  //
  // WHAT'S HAPPENNING NOW
  //

  // << add markers that show locations of key strike locations — exact locations TBC by Matt >>
  {
    bbox: BBOX.iran,
    highlights: ['IR'],
    marks: [COUNTRY_LABELS.iran, CITY_LABELS.tehran]
  },

  // << shift focus of map across to Israel; add markers that show locations of key strike locations — exact locations TBC by Matt >>
  {
    bbox: BBOX.israelPalestine,
    highlights: ['IL'],
    marks: [COUNTRY_LABELS.israel, CITY_LABELS.telAviv]
  },

  //
  // WHAT ABOUT THE BIG GLOBAL POWERS?
  //

  // << zoom out map and centre on Russia; label and highlight Russia; add marker for Moscow >>
  {
    bbox: BBOX.russia,
    highlights: ['RU'],
    marks: [COUNTRY_LABELS.russia, CITY_LABELS.moscow]
  },

  //<< move map to centre on China; label and highlight China; add marker for Beijing >>
  {
    bbox: BBOX.china,
    highlights: ['CN'],
    marks: [COUNTRY_LABELS.china, CITY_LABELS.beijing]
  },

  //<< move map to centre on US; label and highlight United States; add marker for Washington DC >>
  {
    bbox: BBOX.us,
    highlights: ['US'],
    marks: [COUNTRY_LABELS.us, CITY_LABELS.washington]
  }
];
