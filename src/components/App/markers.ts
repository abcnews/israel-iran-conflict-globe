type Label = {
  center: [number, number];
  label: string;
  hasDot: boolean;
};

type Marker = {
  center: [number, number];
  labels: Label[];
  highlights: string[]; // country codes
  marks: {
    location: [number, number];
    type: 'dot' | 'strike';
  }[];
};
