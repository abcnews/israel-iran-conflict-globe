import json from '../src/components/Globe/world-all-countries.json' assert { type: 'json' };

const geometries = json.objects['custom.geo'].geometries;

const newGeometries = geometries.map(geometry => {
  return {
    arcs: geometry.arcs,
    type: geometry.type,
    properties: { name_en: geometry.properties.name_en, iso_a2: geometry.properties.iso_a2 }
  };
});

const newJson = {
  ...json,
  objects: { ...json.objects, ['custom.geo']: { ...json.objects['custom.geo'], geometries: newGeometries } }
};

await Deno.writeTextFile('./world-stripped.json', JSON.stringify(newJson));
