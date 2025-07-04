export type LabelVariant = 'city' | 'country' | 'sea';
export type MarkVariant = 'none' | 'dot' | 'strike';
export type Mark = {
  center: [number, number];
  label: string;
  labelVariant: LabelVariant;
  markVariant: MarkVariant;
  invertTextColour?: boolean;
};

export type BBox = [number, number][];

type Marker = {
  bbox: BBox;
  highlights: string[]; // country codes
  marks: Mark[];
  rotate?: 'east' | 'west' | 'none';
};

// Bounding boxes of each view. Re-used multiple times across the set of markers
export const BBOX = {
  australia: [
    [134.24499605549966, -9.025441090234793],
    [125.52996151877045, -11.103385393068422],
    [115.98251871895138, -17.296754354572897],
    [110.92377483055009, -23.224663671982867],
    [110.14692452916199, -28.425893135322433],
    [108.18117594760355, -35.570726702851275],
    [111.86220404846375, -38.1021836751309],
    [119.19966755544579, -40.797327774237054],
    [127.81234388907751, -41.601532716000435],
    [135.4884118412681, -43.12689186163408],
    [146.97103360767392, -46.203725319347335],
    [153.70608142908105, -45.00884681320386],
    [155.44626274886502, -36.02138456555684],
    [158.5616263457394, -27.392453769040877],
    [153.13605258187306, -19.357379614480237],
    [148.32487865619487, -12.576817276254957],
    [144.16012068777735, -8.756097743842403],
    [134.24499605549966, -9.025441090234793]
  ] as BBox,
  middleEast: [
    [31.051943414195676, 29.584896108599622],
    [64.01290174701424, 22.853642414627473],
    [65.41974325537097, 32.823116151664365],
    [59.800328485661396, 39.025290014905494],
    [44.72883018329952, 41.27546858421755],
    [30.550463080278746, 34.94008737866662],
    [31.051943414195676, 29.584896108599622]
  ] as BBox,
  middleEastWider: [
    [27.25120971638492, 40.47022089200098],
    [27.25120971638492, 9.419896377564726],
    [68.64247427157355, 9.419896377564726],
    [68.64247427157355, 40.47022089200098]
  ] as BBox,
  israelPalestine: [
    [33.832069633571564, 31.280598486180153],
    [34.89856440275247, 28.850141436765156],
    [36.18723412716167, 31.90173767750484],
    [35.99352779143837, 33.56542742972778],
    [34.833829038647195, 33.42522851996587],
    [33.832069633571564, 31.280598486180153]
  ] as BBox,
  israelPalestineLebanon: [
    [34.98433330746869, 28.973183596643224],
    [37.60019878450015, 34.71277651932391],
    [36.26610936611277, 36.95976496507677],
    [33.70885639410537, 31.233065028894217],
    [34.98433330746869, 28.973183596643224]
  ] as BBox,
  israelPalestineWide: [
    [-68.80591027309652, 76.13728489303901],
    [-68.80591027309652, -73.18793586041532],
    [159.5568675584659, -73.18793586041532],
    [159.5568675584659, 76.13728489303901],
    [-68.80591027309652, 76.13728489303901]
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
  iranStrikes: [
    [51.19958265974299, 36.57900400736753],
    [46.028221972339, 36.436344379995646],
    [46.51536366407612, 29.2809104009594],
    [58.71016561336367, 28.595668149128798],
    [57.353657156888346, 36.38220907559513],
    [51.19958265974299, 36.57900400736753]
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
    [-174.41328109121625, 66.55634538317918],
    [-152.75690345553275, 54.21843870257504],
    [-117.24588727363395, 25.988852295564882],
    [-73.41693562504393, 21.614580264381743],
    [-45.138504161455955, 11.874778703435453],
    [-29.183482148696953, 24.849227210346314],
    [-66.3961205274009, 47.51024734941899],
    [-174.41328109121625, 66.55634538317918]
  ] as BBox,
  qatar: [
    [44.24332436604138, 29.266449525467365],
    [44.24332436604138, 20.702654725014682],
    [58.191405581507894, 20.702654725014682],
    [58.191405581507894, 29.266449525467365],
    [44.24332436604138, 29.266449525467365]
  ] as BBox
};

const COUNTRY_LABELS: Record<string, Mark> = {
  israel: {
    center: [34.80789466864397, 31.77585694846691],
    label: 'Israel',
    labelVariant: 'country',
    markVariant: 'none'
  },
  israelInverted: {
    center: [34.80789466864397, 31.77585694846691],
    label: 'Israel',
    labelVariant: 'country',
    markVariant: 'none',
    invertTextColour: true
  },
  iran: {
    center: [53.99194615403175, 33.549571719171794],
    label: 'Iran',
    labelVariant: 'country',
    markVariant: 'none'
  },
  iraq: {
    center: [43.43389647013157, 33.03696495172571],
    label: 'Iraq',
    labelVariant: 'country',
    markVariant: 'none'
  },
  iraqInverted: {
    center: [43.43389647013157, 33.03696495172571],
    label: 'Iraq',
    labelVariant: 'country',
    markVariant: 'none',
    invertTextColour: true
  },
  gaza: {
    center: [34.3840523250353, 31.449685955418218],
    label: 'Gaza',
    labelVariant: 'country',
    markVariant: 'none'
  },
  gazaInverted: {
    center: [34.3840523250353, 31.449685955418218],
    label: 'Gaza',
    labelVariant: 'country',
    markVariant: 'none',
    invertTextColour: true
  },
  westBank: {
    center: [35.27869658593059, 32.2544390687239],
    label: 'West Bank',
    labelVariant: 'country',
    markVariant: 'none'
  },
  lebanon: {
    center: [36.08896444166055, 34.20363012231529],
    label: 'Lebanon',
    labelVariant: 'country',
    markVariant: 'none'
  },
  syria: {
    center: [38.47117881843772, 34.84728007303045],
    label: 'Syria',
    labelVariant: 'country',
    markVariant: 'none'
  },
  syriaInverted: {
    center: [38.47117881843772, 34.84728007303045],
    label: 'Syria',
    labelVariant: 'country',
    markVariant: 'none',
    invertTextColour: true
  },
  saudiArabia: {
    center: [42.06433636388732, 25.239791126859572],
    label: 'Saudi Arabia',
    labelVariant: 'country',
    markVariant: 'none'
  },
  saudiArabiaInverted: {
    center: [42.06433636388732, 25.239791126859572],
    label: 'Saudi Arabia',
    labelVariant: 'country',
    markVariant: 'none',
    invertTextColour: true
  },
  yemen: {
    center: [47.78688342637267, 16.132628866010236],
    label: 'Yemen',
    labelVariant: 'country',
    markVariant: 'none'
  },
  yemenInverted: {
    center: [47.78688342637267, 16.132628866010236],
    label: 'Yemen',
    labelVariant: 'country',
    markVariant: 'none',
    invertTextColour: true
  },
  russia: {
    center: [96.72551617665954, 61.39503934954294],
    label: 'Russia',
    labelVariant: 'country',
    markVariant: 'none'
  },
  china: {
    center: [97.1131265294776, 34.2934365447086],
    label: 'China',
    labelVariant: 'country',
    markVariant: 'none'
  },
  us: {
    center: [-103.3295441731998, 38.78455886002209],
    label: 'United States',
    labelVariant: 'country',
    markVariant: 'none'
  }
};

const CITY_LABELS: Record<string, Mark> = {
  alUdeid: {
    center: [51.318611, 25.118611],
    label: 'Al Udeid air base',
    labelVariant: 'city',
    markVariant: 'strike'
  },
  alUdeidInverted: {
    center: [51.318611, 25.118611],
    label: 'Al Udeid air base',
    labelVariant: 'city',
    markVariant: 'strike',
    invertTextColour: true
  },
  fordow: {
    center: [50.9981, 34.8845],
    label: 'Fordow',
    labelVariant: 'city',
    markVariant: 'strike'
  },
  natanz: {
    center: [51.716667, 33.716667],
    label: 'Natanz',
    labelVariant: 'city',
    markVariant: 'strike'
  },
  isfahan: {
    center: [51.826131, 32.573981],
    label: 'Isfahan',
    labelVariant: 'city',
    markVariant: 'strike'
  },
  telAviv: {
    center: [34.78577100552596, 32.091771978557844],
    label: 'Tel Aviv',
    labelVariant: 'city',
    markVariant: 'dot'
  },
  telAvivStrike: {
    center: [34.78577100552596, 32.091771978557844],
    label: 'Tel Aviv',
    labelVariant: 'city',
    markVariant: 'strike'
  },
  haifa: {
    center: [35.03154284866059, 32.82102587987124],
    label: 'Haifa',
    labelVariant: 'city',
    markVariant: 'strike'
  },
  beerSheva: {
    center: [34.786667, 31.252222],
    label: "Be'er Sheva",
    labelVariant: 'city',
    markVariant: 'strike'
  },

  tehran: {
    center: [51.36813962138109, 35.70238478913372],
    label: 'Tehran',
    labelVariant: 'city',
    markVariant: 'dot'
  },
  tehranStrike: {
    center: [51.36813962138109, 35.70238478913372],
    label: 'Tehran',
    labelVariant: 'city',
    markVariant: 'strike'
  },
  beirut: {
    center: [35.53047699408555, 33.870145155827814],
    label: 'Beirut',
    labelVariant: 'city',
    markVariant: 'dot'
  },
  damascus: {
    center: [36.30575054211161, 33.513047247553146],
    label: 'Damascus',
    labelVariant: 'city',
    markVariant: 'dot'
  },
  sanaa: {
    center: [44.19843305357395, 15.3416817915042],
    label: "S'anaa",
    labelVariant: 'city',
    markVariant: 'dot'
  },
  moscow: {
    center: [37.70195666033055, 55.75572025579794],
    label: 'Moscow',
    labelVariant: 'city',
    markVariant: 'dot'
  },
  beijing: {
    center: [116.38285828328128, 39.88046215316737],
    label: 'Beijing',
    labelVariant: 'city',
    markVariant: 'dot'
  },
  washington: {
    center: [-77.07148562066993, 38.88601799872134],
    label: 'Washington',
    labelVariant: 'city',
    markVariant: 'dot'
  }
};

export const markers: Record<string | number, Marker> = {
  //
  // IRANIAN ALLIES
  //

  //<< enter full-screen map; Israel and Iran are highlighted countries and labelled; depending on space and zoom level also label (but don’t highlight) Iraq and Syria >>
  0: {
    bbox: BBOX.middleEast,
    highlights: ['IL', 'IR'],
    marks: [
      COUNTRY_LABELS.israelInverted,
      COUNTRY_LABELS.iran,
      COUNTRY_LABELS.saudiArabiaInverted,
      COUNTRY_LABELS.yemenInverted,
      COUNTRY_LABELS.iraqInverted,
      COUNTRY_LABELS.syriaInverted
    ]
  },

  // << map changes to centre on Israel and zoom in closer (if higher zoom level looks okay?); Israel remains highlighted and labelled; remove highlight and label from Iran (won’t be visible anyway) >>
  1: {
    bbox: BBOX.israelPalestine,
    highlights: ['IL'],
    marks: [COUNTRY_LABELS.israel, CITY_LABELS.telAviv]
  },

  // << add highlight and label to Gaza Strip  >>
  2: {
    bbox: BBOX.israelPalestine,
    highlights: ['PS_0'],
    marks: [COUNTRY_LABELS.israelInverted, COUNTRY_LABELS.gazaInverted]
  },

  // << add highlight and label to West Bank >>
  3: {
    bbox: BBOX.israelPalestine,
    highlights: ['PS_1', 'PS_0'],
    marks: [COUNTRY_LABELS.israelInverted, CITY_LABELS.telAviv, COUNTRY_LABELS.gazaInverted, COUNTRY_LABELS.westBank]
  },

  // << zoom out and centre map on Lebanon; keep Israel within the frame; add highlight and label to Lebanon; add marker for Beirut; remove labels from Gaza Strip and West Bank >>
  4: {
    bbox: BBOX.israelPalestineLebanon,
    highlights: ['LB'],
    marks: [COUNTRY_LABELS.israelInverted, COUNTRY_LABELS.lebanon, CITY_LABELS.beirut]
  },

  // << zoom out and centre map on Syria; keep Israel within the frame; add highlight and label to Syria; add marker for Damascus; remove marker for Beirut; keep label for Syria (if spacing allows) >>
  5: {
    bbox: BBOX.syria,
    highlights: ['SY'],
    marks: [COUNTRY_LABELS.israelInverted, COUNTRY_LABELS.syria, CITY_LABELS.damascus]
  },

  // << stay at same zoom level but move Yemen to centre of frame; add label and highlight to Yemen; add marker for Sanaa; include label for Saudi Arabia if possible >>
  6: {
    bbox: BBOX.yemen,
    highlights: ['YE'],
    marks: [COUNTRY_LABELS.yemen, COUNTRY_LABELS.saudiArabiaInverted, CITY_LABELS.sanaa]
  },

  // << zoom out a bit and move back to centreing on Israel and Iran; highlights and labels on Israel, Iran, Syria, Lebanon, Yemen; Saudi Arabia also labelled if it fits >>
  7: {
    bbox: BBOX.middleEastWider,
    highlights: ['IL', 'IR'],
    marks: [
      COUNTRY_LABELS.israelInverted,
      COUNTRY_LABELS.iran,
      COUNTRY_LABELS.yemenInverted,
      COUNTRY_LABELS.saudiArabiaInverted
    ]
  },

  // << zoom into Iran and remove all other labels and highlights >>
  8: {
    bbox: BBOX.iran,
    highlights: ['IR'],
    marks: [CITY_LABELS.tehran, COUNTRY_LABELS.iran]
  },

  //
  // WHAT'S HAPPENNING NOW
  //

  // << add markers that show locations of key strike locations — exact locations TBC by Matt >>
  9: {
    bbox: BBOX.iranStrikes,
    highlights: ['IR'],
    marks: [CITY_LABELS.tehranStrike, CITY_LABELS.fordow, CITY_LABELS.natanz, CITY_LABELS.isfahan]
  },

  // << shift focus of map across to Israel; add markers that show locations of key strike locations — exact locations TBC by Matt >>
  10: {
    bbox: BBOX.israelPalestine,
    highlights: ['IL'],
    marks: [CITY_LABELS.telAvivStrike, CITY_LABELS.beerSheva, CITY_LABELS.haifa]
  },

  //
  // WHAT ABOUT THE BIG GLOBAL POWERS?
  //

  // << zoom out map and centre on Russia; label and highlight Russia; add marker for Moscow >>
  11: {
    bbox: BBOX.israelPalestineWide,
    highlights: [],
    marks: [],
    rotate: 'east'
  },

  //<< move map to centre on China; label and highlight China; add marker for Beijing >>
  12: {
    bbox: BBOX.china,
    highlights: ['CN'],
    marks: [COUNTRY_LABELS.china, CITY_LABELS.beijing]
  },

  //<< move map to centre on US; label and highlight United States; add marker for Washington DC >>
  13: {
    bbox: BBOX.us,
    highlights: ['US'],
    marks: [COUNTRY_LABELS.us, CITY_LABELS.washington]
  },
  14: {
    bbox: BBOX.middleEast,
    highlights: ['IR', 'IL'],
    marks: [CITY_LABELS.fordow, CITY_LABELS.isfahan, CITY_LABELS.natanz]
  },
  15: {
    bbox: BBOX.qatar,
    highlights: ['QA'],
    marks: [CITY_LABELS.alUdeidInverted]
  }
};

export const ALL_LABELS = { ...COUNTRY_LABELS, ...CITY_LABELS };
