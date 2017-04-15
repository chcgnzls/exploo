#!/bin/R

options(stringsAsFactors=FALSE)
plc <- read.csv("national_places.csv")
crack <- read.csv("crack.csv")
crack$STATEFP <- NA
crack$COUNTYFP <- NA

plc.placenames <- toupper(enc2utf8(plc$PLACENAME))
plc.placenames <- gsub("\\.* ", "_", plc.placenames)

crack.names <- unique(crack$CITY_NAME)

plc.matches <- sapply(crack.names, function(x) plc[grepl(paste0("^",x), plc.placenames), ], simplify=F)

n.matches <- sapply(plc.matches, nrow)

tmp <- names(n.matches[n.matches == 1])

for(n in tmp) {
	crack[which(crack$CITY_NAME == n), "STATEFP"] <- plc.matches[[n]]$STATEFP
	crack[which(crack$CITY_NAME == n), "COUNTYFP"] <- plc.matches[[n]]$COUNTYFP_1
}

tmp <- crack.names[! crack.names %in% tmp]

help <- function(v, df, lst) {
	askForRowId <- function(n, lst) {
		while(TRUE) {
			l <- lst[[n]][, c(1:4, 7, 13)]
			print(n)
			print(l)
			r <- readline(prompt="Row Number [int/n/q]: ")
			if (r %in% c("n", "q")) break	
			print(l[r,])
			P <- readline(prompt=paste0(r, "? [Y/n] "))
			if(P == "y" | P == "") break
		}
	return(r)
	}

	for(n in v){
		rowId <- askForRowId(n, lst)	
		if (rowId == "n") next
		if (rowId == "q") break
		df[which(df$CITY_NAME == n), "STATEFP"] <- lst[[n]][rowId, "STATEFP"]
		df[which(df$CITY_NAME == n), "COUNTYFP"] <- lst[[n]][rowId, "COUNTYFP_1"]
	}
	return(df)
}
