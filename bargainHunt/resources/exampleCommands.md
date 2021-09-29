# Creating watchlists
Take a list of correlated symbols and find which are entering the buy zone
## Volatiles
```
./bargainHunter.js --inFile=symbols/correlated-volatility.txt --outFile=outputs/wfbz-volatile.json --realData --percentFromAverage=10
```
## Large-cap
```
./bargainHunter.js --inFile=symbols/correlated-ma20.txt outFile=outputs/wfbz-large-cap.json --realData
```

## Value
```
./bargainHunt/bargainHunter.js --inFile=bargainHunt/symbols/goodValue.txt --maPeriod=50 --percentFromAverage=10 --realData
```

# Updating watchlists
Take a current watchlist and reorder according to distance from the moving average
## Large Cap
```
./bargainHunter.js --inFile=symbols/wfbz-large-cap.txt --outFile=outputs/wfbz-large-cap.json --realData 
```

## Volatiles
```
./bargainHunter.js --inFile=symbols/wfbz-volatile.txt --outFile=outputs/wfbz-volatile.json --realData 
```

# Updating Stop Losses
Take a list of current stocks and find new stop losses based on a allowed distance from the moving average
```
./holdingPattern.js --realData
```

# Finding new correlations
Take a lis of suspected performers and test them for correlation to their 20-day moving average
```
./averageSleuth.js --inFile=symbols/volatile-volume.txt --realData --outFile=temp/new-volatiles.json
```