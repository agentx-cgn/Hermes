#!/usr/bin/env python2.5

fileIn  = open('words.txt', 'r')
fileOut = open('words.js', 'w')

buffer = "var w = [];\n"
counter = 0

## print dir(str("huhu"))

for line in fileIn :
  word = line.split("\t")[1]
  if len(word) == 1 : continue
  if not word.islower() : continue
  buffer += "w[" + str(counter) + "]='" + word + "';\n"
  counter += 1
  if counter == 10000 : break

fileIn.close()
fileOut.write(buffer)
fileOut.close()
