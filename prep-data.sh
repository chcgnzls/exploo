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
SHPURL="http://www2.census.gov/geo/tiger/GENZ2010/gz_2010_us_050_00_500k.zip" 
SHPFILE="${SHPURL##h*\/}"
SHPFILE="${SHPFILE%%.zip}"
APIVAR="B01003_001E,B99192_001E"
APIURL="http://api.census.gov/data/2015/acs1?get=$APIVAR&for=county:*&key=`cat ~/Documents/census-api-key`"
APIFILE="usa-cty-cov.json"
OUTCOME="perm_res_p25_kr32"
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
		-o | --outcome-var)
			if [ ! -z "$2" ]; then
				OUTCOME="$2"
				shift
			fi ;;
		--outcome-var=?*)
			OUTCOME="${1#*=}" ;;
		-au | --api-url)
			if [ -z "$2" ]; then
				APIURL="$2"
				shift
			fi ;;
		--api-url=?*)
			APIURL="${1#*=}" ;;
		-av | --api-var=)
			if [ -z "$2" ]; then
				APIVAR="$2"
				shift
			fi ;;
		--api-url=?*)
			APIVAR="${1#*=}" ;;
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
if [ ! -e ./shp/"$SHPFILE".zip ]; then
	curl "$SHPURL" -o ./shp/"$SHPFILE".zip
	unzip -o ./shp/"$SHPFILE".zip -d ./shp/
	shp2json ./shp/"$SHPFILE".shp -o ./json/usa.json
fi 

if [ ! -e ./json/"$APIFILE" ]; then
	curl "$APIURL" -o ./json/"$APIFILE"
	ndjson-cat ./json/"$APIFILE" | ndjson-split "d.slice(1)" | ndjson-map '{GEOID : d.slice(-2)[0] + d.slice(-1)[0], Population: d[0], "Median Household Inomce": d[1]}' > ./json/usa-cty-cov.ndjson
fi

if [ ! -e ./json/usa-albers-id.ndjsosn ]; then
	geoproject "d3.geoAlbersUsa()" < json/usa.json | ndjson-split "d.features" | ndjson-map "d.GEOID = d.properties.STATE + d.properties.COUNTY, d" > ./json/usa-albers-id.ndjson
	#geoproject "d3.geoAlbersUsa()" < ./json/usa.json | ndjson-split "d.features" | ndjson-map 'd.GEOID = d.properties.GEOID, d' > ./json/usa-albers-id.ndjson
fi

#  Prepare Mobility Data
if [ ! -e ./json/nbhds.json ]; then 
	Rscript "format_mob_data.R"
	csv2json ./csv/nbhds.csv -o ./json/nbhds.json
	ndjson-cat ./json/nbhds.json | ndjson-split 'd.slice(1)' > ./json/nbhds.ndjson
fi

#  Merge Geodata and Mob data
if [ ! -e ./json/usa-"$OUTCOME".ndjson ]; then

	ndjson-join "d.GEOID" ./json/usa-albers-id.ndjson ./json/nbhds.ndjson | ndjson-map "d[0].properties = {outcome: Number(d[1].$OUTCOME), county: d[0].properties.NAME, state: d[1].stateabbrv, pop: d[1].cty_pop2000, unemp: d[1].unemp_rate, unemp_rate_st: d[1].unemp_rate_st, area: d[0].properties.ALAND}, d[0]" > ./json/usa-"$OUTCOME".ndjson

#	ndjson-join "d.GEOID" ./json/nbhds.ndjson ./json/usa-cty-cov.ndjson | ndjson-map "Object.assign(d[0],d[1])" > ./json/usa-nbhds.ndjson
#	ndjson-join 'd.GEOID' ./json/usa-albers-id.ndjson ./json/usa-nbhds.ndjson | ndjson-map "d[0].properties = {outcome: Number(d[1].$OUTCOME), county: d[0].properties.NAME, state: d[1].stateabbrv, area: d[0].properties.ALAND}, d[0]" > ./json/usa-"$OUTCOME".ndjson

fi

MAPTHIS="./json/usa-"$OUTCOME".ndjson"
ndjson-map -r d3 '(d.properties.fill = d3.scaleLinear().domain([30.64011, 61.14268]).range(["orange", "blue"])(d.properties.outcome), d)' < "$MAPTHIS" > tmp.ndjson

#  Compress
geo2topo -n cty=tmp.ndjson > usa-cty-topo.json
toposimplify -p 1 -f < usa-cty-topo.json > usa-sm.json
topoquantize 1e5 < usa-sm.json > usa-sm-q.json
