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
    marks: [COUNTRY_LABELS.israel, COUNTRY_LABELS.iran]
  },

  // << map changes to centre on Israel and zoom in closer (if higher zoom level looks okay?); Israel remains highlighted and labelled; remove highlight and label from Iran (won’t be visible anyway) >>
  {
    bbox: BBOX.israelPalestine,
    highlights: ['IL'],
    marks: []
  },

  // << add highlight and label to Gaza Strip  >>
  {
    bbox: BBOX.israelPalestine,
    highlights: ['GZ'],
    marks: []
  },

  // << add highlight and label to West Bank >>
  {
    bbox: BBOX.israelPalestine,
    highlights: ['GZ', 'WB'],
    marks: []
  },

  // << zoom out and centre map on Lebanon; keep Israel within the frame; add highlight and label to Lebanon; add marker for Beirut; remove labels from Gaza Strip and West Bank >>
  {
    bbox: BBOX.israelPalestine,
    highlights: ['LB'],
    marks: []
  },

  // << zoom out and centre map on Syria; keep Israel within the frame; add highlight and label to Syria; add marker for Damascus; remove marker for Beirut; keep label for Syria (if spacing allows) >>
  {
    bbox: BBOX.syria,
    highlights: ['SY'],
    marks: []
  },

  // << stay at same zoom level but move Yemen to centre of frame; add label and highlight to Yemen; add marker for Sanaa; include label for Saudi Arabia if possible >>
  {
    bbox: BBOX.yemen,
    highlights: ['YE'],
    marks: []
  },

  // << zoom out a bit and move back to centreing on Israel and Iran; highlights and labels on Israel, Iran, Syria, Lebanon, Yemen; Saudi Arabia also labelled if it fits >>
  {
    bbox: BBOX.middleEastWider,
    highlights: ['IL', 'IR', 'SY', 'LB', 'YE'],
    marks: []
  },

  // << zoom into Iran and remove all other labels and highlights >>
  {
    bbox: BBOX.iran,
    highlights: ['IR'],
    marks: []
  },

  //
  // WHAT'S HAPPENNING NOW
  //

  // << add markers that show locations of key strike locations — exact locations TBC by Matt >>
  {
    bbox: BBOX.iran,
    highlights: ['IR'],
    marks: []
  },

  // << shift focus of map across to Israel; add markers that show locations of key strike locations — exact locations TBC by Matt >>
  {
    bbox: BBOX.israelPalestine,
    highlights: ['IL'],
    marks: []
  },

  //
  // WHAT ABOUT THE BIG GLOBAL POWERS?
  //

  // << zoom out map and centre on Russia; label and highlight Russia; add marker for Moscow >>
  {
    bbox: BBOX.russia,
    highlights: ['RU'],
    marks: []
  },

  //<< move map to centre on China; label and highlight China; add marker for Beijing >>
  {
    bbox: BBOX.china,
    highlights: ['CN'],
    marks: []
  },

  //<< move map to centre on US; label and highlight United States; add marker for Washington DC >>
  {
    bbox: BBOX.us,
    highlights: ['US'],
    marks: []
  }
];
