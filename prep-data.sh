#!/bin/bash -x

E_WRONG_ARG=2
E_MISSING_FILE=3
E_WONG_OUTCOME=4

usage () {
	echo "`basename "$0"`: usage: "$0" [OPTIONS] file"
	if [ -z "$1" ]; then
		exit 1
	else
		exit $1
	fi 
}

#  Default files
SHPURL="http://www2.census.gov/geo/tiger/GENZ2010/gz_2010_us_050_00_500k.zip" 
SHPFILE="${SHPURL##h*\/}"
OUTCOME="perm_res_p25_kr26"
NOSKIP=true
MESSY=false

#  Parse options
while :; do
	case $1 in 
		-shpurl | --shapefile-url)
			if [ ! -z "$2" ]; then
				SHPURL="$2"
				shift
			fi ;;
		--shapefile-url=?*)
			SHPURL="${1#*=}" ;;
		-o | -outcome-var)
			if [ ! -z "$2" ]; then
				OUTCOME="$2"
				shift
			fi ;;
		--outcome-var=?*)
			OUTCOME="${1#*=}" ;;
		-s | --skip)
			NOSKIP=false ;;
		-m | --messy)
			MESSY=true ;;
		--)
			shift ; break ;;
		*)
			break ;;
	esac
	shift
done

#  Downlaod
if [ ! -e ./shp/"$SHPFILE" ]; then
	curl "$SHPURL" -o ./shp/"$SHPFILE"
	unzip -o ./shp/"$SHPFILE" -d ./shp/
	shp2json ./shp/cb_2014_us_county_500k.shp -o ./json/usa.json
fi 

geoproject 'd3.geoAlbersUsa()' < ./json/usa.json > ./json/usa-albers.json
ndjson-split 'd.features' < ./json/usa-albers.json > ./json/usa-albers.ndjson
ndjson-map 'd.GEOID = d.properties.GEOID, d' < ./json/usa-albers.ndjson > ./json/usa-albers-id.ndjson

#  Prepare Mobility Data
if [ ! -e ./json/nbhds.json ]; then 
	Rscript "format_mob_data.R"
	csv2json ./csv/nbhds.csv ./json/nbhds.json
	ndjson-cat ./json/nbhds.json | ndjson-split 'd.slice(1)' > ./json/nbhds.ndjson
fi

#  Merge Geodata and Mob data
ndjson-join 'd.GEOID' ./json/usa-albers-id.ndjson ./json/nbhds.ndjson > ./json/usa-nbhds.ndjson

#  Use d3 to fill causal_p25_cty_kr26 color
ndjson-map "d[0].properties = {outcome: Number(d[1].$OUTCOME), county: d[0].properties.NAME, state: d[1].stateabbrv, area: d[0].properties.ALAND}, d[0]" < ./json/usa-nbhds.ndjson > ./json/usa-"$OUTCOME".ndjson

MAPTHIS="./json/usa-"$OUTCOME".ndjson"

#ndjson-map -r d3 '(d.properties.fill = d3.scaleLinear(d3.interpolateViridis).domain([d3.min(d.properties.outcome),d3.max(d.properties.outcome)]) (d.properties.outcome), d)' < "$MAPTHIS" > usa-color.ndjson

#  Compress
geo2topo -n cty="$MAPTHIS" > usa-cty-topo.json
toposimplify -p 1 -f < usa-cty-topo.json > usa-sm.json
topoquantize 1e5 < usa-sm.json > usa-sm-q.json

#  Clean, maybe
if [ $MESSY = "false" ]; then
	rm ./usa-sm.json ./usa-cty-topo.json ./json/usa-nbhds.ndjson ./json/usa-albers.ndjson ./json/usa.json
fi
