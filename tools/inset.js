/* Builds src/oslofjord.json: the Oslofjord inset (real coastline, Natural Earth 1:10m via world-atlas).
   Run: node tools/inset.js  (only needed if the frame or the places change) */
const fs = require("fs");
const path = require("path");
const { feature } = require("topojson-client");
const d3 = require("d3-geo");
const topo = require("world-atlas/land-10m.json");
const land = feature(topo, topo.objects.land);
const W = 240, H = 200;
const frame = { type: "MultiPoint", coordinates: [[10.38, 59.6], [10.98, 59.95]] };
const proj = d3.geoMercator().fitExtent([[0, 0], [W, H]], frame).clipExtent([[0, 0], [W, H]]);
const r = (p) => p.map((v) => Math.round(v * 10) / 10);
const out = {
  w: W, h: H,
  land: d3.geoPath(proj).digits(1)(land),
  steder: {
    oslo: r(proj([10.75, 59.912])),
    nesodden: [124, 84], // label on the peninsula itself (the 1:10m coast is coarse, so the town point lands in the water)
    vinterbro: r(proj([10.77, 59.74])),
  },
};
fs.writeFileSync(path.join(__dirname, "../src/oslofjord.json"), JSON.stringify(out));
console.log("oslofjord.json", JSON.stringify(out).length, "bytes", out.steder);
