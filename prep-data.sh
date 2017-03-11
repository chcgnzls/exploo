#!/bin/bash -x

#  Downlaod
curl "www2.census.gov/geo/tiger/GENZ2014/shp/cb_2014_us_county_500k.zip" -o ./shp/cb_2014_us_county_500k.zip 
unzip -o ./shp/cb_2014_us_county_500k.zip -d ./shp/

#  Turn .shp to .json
shp2json ./shp/cb_2014_us_county_500k.shp -o ./json/usa.json

#  Project to Albers
geoproject 'd3.geoAlbersUsa()' < ./json/usa.json > ./json/usa-albers.json
ndjson-split 'd.features' < ./json/usa-albers.json > ./json/usa-albers.ndjson
ndjson-map 'd.GEOID = d.properties.GEOID, d' < ./json/usa-albers.ndjson > ./json/usa-albers-id.ndjson

#  Prepare Mobility Data
Rscript "format_mob_data.R"
csv2json ./csv/nbhds.csv ./json/nbhds.json
ndjson-cat ./json/nbhds.json | ndjson-split 'd.slice(1)' > ./json/nbhds.ndjson

#  Merge Geodata and Mob data
ndjson-join 'd.GEOID' ./json/usa-albers-id.ndjson ./json/nbhds.ndjson > ./json/usa-nbhds.ndjson

#  Use d3 to fill causal_p25_cty_kr26 color
ndjson-map 'd[0].properties = {outcome: d[1].causal_p25_cty_kr26}, d[0]' < ./json/usa-nbhds.ndjson > ./json/usa-cty_p25_kr26.ndjson
ndjson-map 'd[0].properties = {outcome: d[1].causal_p25_cz_cty_kr26}, d[0]' < ./json/usa-nbhds.ndjson > ./json/usa-cz_p25_kr26.ndjson

MAPTHIS="./json/usa-cty_p25_kr26.ndjson"

ndjson-map -r d3 '(d.properties.fill = d3.scaleSequential(d3.interpolateViridis).domain([0,5]) (d.properties.outcome), d)' < "$MAPTHIS" > usa-color.ndjson

#  Compress
geo2topo -n cty="$MAPTHIS" > usa-cty-topo.json
toposimplify -p 1 -f < usa-cty-topo.json > usa-sm.json
topoquantize 1e5 < usa-sm.json > usa-sm-q.json

