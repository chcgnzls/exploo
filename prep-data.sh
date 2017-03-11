#!/bin/bash

#  Downlaod
curl -O "www2.census.gov/geo/tiger/GENZ2014/shp/ch_2014_us_county_500k.zip" 

#  Turn .shp to .json
shp2json ./shp/cb_2014_us_county_500k.shp -o ./json/usa.json

#  Project to Albers
geoproject 'd3.geoAlbersUsa()' < ./json/usa.json > ./json/usa-albers.json
ndjson-split 'd.features' < ./json/usa-albers.json > ./json/usa-albers.ndjson
ndjson-map 'd.GEOID = d.properties.GEOID, d' < ./json/usa-albers.ndjson > ./json/usa-albers-id.ndjson

#  Prepare Mobility Data
Rscript "format_mob_data.R"
csv2json ./csv/nbhds.csv -o ./json/nbhds.json
ndjson-split 'd.slice(1)' < ./json/nbhds.json > ./json/nbhds.ndjson

#  Merge Geodata and Mob data
ndjson-join 'd.GEOID' ./json/usa-albers-id.ndjson ./json/nbhds.ndjson > ./json/usa-nbhds.ndjson

#  Use d3 to fill causal_p25_cty_kr26 color
ndjson-map 'd[0].properties = {causal_p25_cty_kr26: d[1].causal_p25_cty_kr26}, d[0]' < ./json/usa-nbhds.ndjson > ./json/usa-cty_p25_kr26.ndjson
ndjson-map 'd[0].properties = {causal_p25_cz_cty_kr26: d[1].causal_p25_cz_cty_kr26}, d[0]' < ./json/usa-nbhds.ndjson > ./json/usa-cz_p25_kr26.ndjson

ndjson-map -r d3 '(d.properties.fill = d3.scaleSequential(d3.iterpolateViridis).domain([0,4000]) (d.properties.causal_p25_cty_kr26), d)' < ./json/usa-causal.ndjson > usa-color.ndjson

ndjson-map -r d3 'd.properties.fill = d3.scaleSequential(d3.iterpolateViridis).domain([0,10]) (d.causal_p25_cz_cty_kr26), d)' < ./json/usa-cz_p25_kr26.ndjson > usa-color.ndjson

#  Compress
geo2topo -n cty=./json/usa-cty_p25_kr26.ndjson > usa-cty-topo.json
toposimplify -p 1 -f < usa-cty-topo.json > sim.json
topoquantize 1e5 < sim.json > sim-q.json

