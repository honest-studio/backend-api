# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1000000 -e 1030000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1030000 -e 1060000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1060000 -e 1090000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1090000 -e 1120000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1120000 -e 1150000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1150000 -e 1180000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1180000 -e 1210000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1210000 -e 1240000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1240000 -e 1270000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1270000 -e 1300000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1300000 -e 1330000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1330000 -e 1360000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1360000 -e 1390000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1390000 -e 1420000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1420000 -e 1450000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1450000 -e 1480000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1480000 -e 1510000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1510000 -e 1540000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1540000 -e 1570000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1570000 -e 1600000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1600000 -e 1630000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1630000 -e 1660000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1660000 -e 1690000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1690000 -e 1720000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1720000 -e 1750000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1750000 -e 1780000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1780000 -e 1810000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1810000 -e 1840000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1840000 -e 1870000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1870000 -e 1900000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1900000 -e 1930000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1930000 -e 1960000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1960000 -e 1990000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 1990000 -e 2020000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2020000 -e 2050000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2050000 -e 2080000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2080000 -e 2110000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2110000 -e 2140000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2140000 -e 2170000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2170000 -e 2200000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2200000 -e 2230000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2230000 -e 2260000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2260000 -e 2290000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2290000 -e 2320000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2320000 -e 2350000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2350000 -e 2380000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2380000 -e 2410000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2410000 -e 2440000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2440000 -e 2470000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2470000 -e 2500000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2500000 -e 2530000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2530000 -e 2560000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2560000 -e 2590000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2590000 -e 2620000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2620000 -e 2650000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2650000 -e 2680000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2680000 -e 2710000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2710000 -e 2740000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2740000 -e 2770000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2770000 -e 2800000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2800000 -e 2830000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2830000 -e 2860000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2860000 -e 2890000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2890000 -e 2920000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2920000 -e 2950000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2950000 -e 2980000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 2980000 -e 3010000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3010000 -e 3040000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3040000 -e 3070000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3070000 -e 3100000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3100000 -e 3130000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3130000 -e 3160000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3160000 -e 3190000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3190000 -e 3220000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3220000 -e 3250000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3250000 -e 3280000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3280000 -e 3310000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3310000 -e 3340000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3340000 -e 3370000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3370000 -e 3400000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3400000 -e 3430000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3430000 -e 3460000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3460000 -e 3490000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3490000 -e 3520000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3520000 -e 3550000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3550000 -e 3580000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3580000 -e 3610000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3610000 -e 3640000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3640000 -e 3670000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3670000 -e 3700000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3700000 -e 3730000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3730000 -e 3760000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3760000 -e 3790000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3790000 -e 3820000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3820000 -e 3850000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3850000 -e 3880000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3880000 -e 3910000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3910000 -e 3940000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3940000 -e 3970000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 3970000 -e 4000000 >> /dev/null 2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4000000 -e 4030000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4030000 -e 4060000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4060000 -e 4090000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4090000 -e 4120000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4120000 -e 4150000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4150000 -e 4180000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4180000 -e 4210000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4210000 -e 4240000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4240000 -e 4270000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4270000 -e 4300000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4300000 -e 4330000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4330000 -e 4360000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4360000 -e 4390000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4390000 -e 4420000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4420000 -e 4450000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4450000 -e 4480000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4480000 -e 4510000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4510000 -e 4540000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4540000 -e 4570000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4570000 -e 4600000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4600000 -e 4630000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4630000 -e 4660000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4660000 -e 4690000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4690000 -e 4720000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4720000 -e 4750000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4750000 -e 4780000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4780000 -e 4810000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4810000 -e 4840000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4840000 -e 4870000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4870000 -e 4900000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4900000 -e 4930000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4930000 -e 4960000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4960000 -e 4990000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 4990000 -e 5020000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5020000 -e 5050000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5050000 -e 5080000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5080000 -e 5110000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5110000 -e 5140000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5140000 -e 5170000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5170000 -e 5200000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5200000 -e 5230000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5230000 -e 5260000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5260000 -e 5290000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5290000 -e 5320000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5320000 -e 5350000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5350000 -e 5380000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5380000 -e 5410000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5410000 -e 5440000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5440000 -e 5470000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5470000 -e 5500000 >> /dev/null  2>&1',
'node --max-old-space-size=2500 dist/scripts/Wiki-Importer/Wiki-Import.js -s 5500000 -e 5530000 >> /dev/null  2>&1',







]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()