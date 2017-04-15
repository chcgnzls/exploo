#!/bin/R

options(stringsAsFactors=FALSE)
plc <- read.csv("national_places.csv")
crack <- read.csv("crack.csv")

plc.placenames <- toupper(enc2utf8(plc$PLACENAME))
plc.placenames <- gsub("\\.* ", "_", plc.placenames)

crack.names <- unique(crack$CITY_NAME)

plc.matches.any <- sapply(crack.names, function(x) plc[grepl(paste0(x), place.names), ], simplify=F)

plc.matches.first <- sapply(crack.names, function(x) plc[grepl(paste0("^",x), place.names), ], simplify=F)
