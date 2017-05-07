#!/bin/R
#  Add leading zeros to merge
df <- read.csv("./csv/nbhds_online_data_table4.csv", stringsAsFactor=FALSE)
st <- as.character(df$state_id)
st[which(nchar(st) == 1)] <- paste0("0", st[which(nchar(st) == 1)])
cty <- do.call(rbind, strsplit(as.character(unique(df$cty2000/1000)+0.0001), "\\."))[,2]
cty <- gsub("1$", "", cty)
df$GEOID <- paste0(st, cty)
write.csv(df, file="./csv/nbhds.csv", row.names=FALSE)
