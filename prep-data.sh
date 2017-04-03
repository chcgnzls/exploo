#!/bin/bash -x

ERR_WRONG_ARG=2
ERR_MISSING_FILE=3
ERR_WONG_OUTCOME=4

usage () {
	echo "`basename "$0"`: usage: "$0" [OPTIONS] file"
	if [ -z "$1" ]; then
		exit 1
	else
		exit $ERR_WRONG_ARG
	fi 
}

#  Default files
SHPURL="http://www2.census.gov/geo/tiger/GENZ2014/shp/cb_2014_us_county_500k.zip" 
SHPFILE="${SHPURL##h*\/}"
SHPFILE="${SHPFILE%*.zip}"
APIURL="http://api.census.gov/data/2010/sf1?get=P0010001,P0030001&for=county:*&key=`cat ~/Documents/census-api-key`"
APIFILE="./json/us_cty_pop.json"
OUTCOME="perm_res_p25_kr30"

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
		-o | --outcome-var)
			if [ ! -z "$2" ]; then
				OUTCOME="$2"
				shift
			fi ;;
		--outcome-var=?*)
			OUTCOME="${1#*=}" ;;
	-a | --api-url)
			if [ -z "$2" ]; then
				APIURL="$2"
				shift
			fi ;;
		--api-url=?*)
			APIURL="${1#*=}" ;;
		--)
			shift ; break ;;
		*)
			break ;;
	esac
	shift
done

#  Downlaod
if [ ! -e ./shp/"$SHPFILE".zip ]; then
	curl "$SHPURL" -o ./shp/"$SHPFILE".zip
	unzip -o ./shp/"$SHPFILE".zip -d ./shp/
	shp2json ./shp/"$SHPFILE".shp -o ./json/usa.json
fi 

if [ ! -e ./json/usa-albers-id.ndjson ]; then
	geoproject 'd3.geoAlbersUsa()' < ./json/usa.json > ./json/usa-albers.json
	ndjson-split 'd.features' < ./json/usa-albers.json > ./json/usa-albers.ndjson
	ndjson-map 'd.GEOID = d.properties.GEOID, d' < ./json/usa-albers.ndjson > ./json/usa-albers-id.ndjson
fi

#  Prepare Mobility Data
if [ ! -e ./json/nbhds.json ]; then 
	Rscript "format_mob_data.R"
	csv2json ./csv/nbhds.csv -o ./json/nbhds.json
	ndjson-cat ./json/nbhds.json | ndjson-split 'd.slice(1)' > ./json/nbhds.ndjson
fi

MAPTHIS=./json/usa-"$OUTCOME".ndjson

#  Merge Geodata and Mob data
if [ ! -e "$MAPTHIS" ]; then
	ndjson-join 'd.GEOID' ./json/usa-albers-id.ndjson ./json/nbhds.ndjson > ./json/usa-nbhds.ndjson
	ndjson-map "d[0].properties = {outcome: Number(d[1].$OUTCOME), county: d[0].properties.NAME, state: d[1].stateabbrv, pop: d[1].cty_pop2000, unemp_rate: d[1].unemp_rate, area: d[0].properties.ALAND}, d[0]" < ./json/usa-nbhds.ndjson > ./json/usa-"$OUTCOME".ndjson
fi

#  Compress
geo2topo -n cty="$MAPTHIS" | toposimplify -p 1 -f | topoquantize 1e5 > usa-sm-q.json
