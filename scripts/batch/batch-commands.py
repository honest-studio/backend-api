# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1000000 -e 1015000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1015000 -e 1030000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1030000 -e 1045000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1045000 -e 1060000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1060000 -e 1075000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1075000 -e 1090000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1090000 -e 1105000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1105000 -e 1120000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1120000 -e 1135000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1135000 -e 1150000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1150000 -e 1165000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1165000 -e 1180000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1180000 -e 1195000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1195000 -e 1210000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1210000 -e 1225000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1225000 -e 1240000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1240000 -e 1255000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1255000 -e 1270000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1270000 -e 1285000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1285000 -e 1300000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1300000 -e 1315000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1315000 -e 1330000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1330000 -e 1345000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1345000 -e 1360000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1360000 -e 1375000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1375000 -e 1390000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1390000 -e 1405000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1405000 -e 1420000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1420000 -e 1435000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1435000 -e 1450000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1450000 -e 1465000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1465000 -e 1480000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1480000 -e 1495000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1495000 -e 1510000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1510000 -e 1525000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1525000 -e 1540000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1540000 -e 1555000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1555000 -e 1570000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1570000 -e 1585000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1585000 -e 1600000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1600000 -e 1615000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1615000 -e 1630000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1630000 -e 1645000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1645000 -e 1660000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1660000 -e 1675000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1675000 -e 1690000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1690000 -e 1705000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1705000 -e 1720000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1720000 -e 1735000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1735000 -e 1750000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1750000 -e 1765000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1765000 -e 1780000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1780000 -e 1795000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1795000 -e 1810000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1810000 -e 1825000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1825000 -e 1840000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1840000 -e 1855000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1855000 -e 1870000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1870000 -e 1885000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1885000 -e 1900000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1900000 -e 1915000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1915000 -e 1930000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1930000 -e 1945000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1945000 -e 1960000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1960000 -e 1975000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1975000 -e 1990000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1990000 -e 2005000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2005000 -e 2020000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2020000 -e 2035000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2035000 -e 2050000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2050000 -e 2065000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2065000 -e 2080000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2080000 -e 2095000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2095000 -e 2110000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2110000 -e 2125000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2125000 -e 2140000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2140000 -e 2155000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2155000 -e 2170000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2170000 -e 2185000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2185000 -e 2200000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2200000 -e 2215000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2215000 -e 2230000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2230000 -e 2245000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2245000 -e 2260000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2260000 -e 2275000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2275000 -e 2290000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2290000 -e 2305000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2305000 -e 2320000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2320000 -e 2335000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2335000 -e 2350000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2350000 -e 2365000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2365000 -e 2380000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2380000 -e 2395000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2395000 -e 2410000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2410000 -e 2425000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2425000 -e 2440000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2440000 -e 2455000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2455000 -e 2470000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2470000 -e 2485000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2485000 -e 2500000 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2500000 -e 2515000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2515000 -e 2530000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2530000 -e 2545000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2545000 -e 2560000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2560000 -e 2575000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2575000 -e 2590000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2590000 -e 2605000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2605000 -e 2620000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2620000 -e 2635000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2635000 -e 2650000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2650000 -e 2665000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2665000 -e 2680000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2680000 -e 2695000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2695000 -e 2710000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2710000 -e 2725000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2725000 -e 2740000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2740000 -e 2755000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2755000 -e 2770000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2770000 -e 2785000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2785000 -e 2800000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2800000 -e 2815000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2815000 -e 2830000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2830000 -e 2845000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2845000 -e 2860000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2860000 -e 2875000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2875000 -e 2890000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2890000 -e 2905000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2905000 -e 2920000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2920000 -e 2935000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2935000 -e 2950000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2950000 -e 2965000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2965000 -e 2980000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2980000 -e 2995000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2995000 -e 3010000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3010000 -e 3025000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3025000 -e 3040000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3040000 -e 3055000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3055000 -e 3070000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3070000 -e 3085000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3085000 -e 3100000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3100000 -e 3115000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3115000 -e 3130000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3130000 -e 3145000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3145000 -e 3160000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3160000 -e 3175000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3175000 -e 3190000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3190000 -e 3205000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3205000 -e 3220000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3220000 -e 3235000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3235000 -e 3250000  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3250000 -e 3265000  2>&1',






]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()