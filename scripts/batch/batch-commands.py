# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1 -e 400000 >> scripts/batch/log/batch_00.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 400000 -e 550000 >> scripts/batch/log/batch_01.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 550000 -e 700000 >> scripts/batch/log/batch_02.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 700000 -e 850000 >> scripts/batch/log/batch_03.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 850000 -e 1000000 >> scripts/batch/log/batch_04.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1000000 -e 1150000 >> scripts/batch/log/batch_05.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1150000 -e 1300000 >> scripts/batch/log/batch_06.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1300000 -e 1450000 >> scripts/batch/log/batch_07.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1450000 -e 1600000 >> scripts/batch/log/batch_08.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1600000 -e 1750000 >> scripts/batch/log/batch_09.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1750000 -e 1900000 >> scripts/batch/log/batch_10.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1900000 -e 2050000 >> scripts/batch/log/batch_11.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2050000 -e 2200000 >> scripts/batch/log/batch_12.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2200000 -e 2350000 >> scripts/batch/log/batch_13.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2350000 -e 2500000 >> scripts/batch/log/batch_14.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2500000 -e 2650000 >> scripts/batch/log/batch_15.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2650000 -e 2800000 >> scripts/batch/log/batch_16.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2800000 -e 2950000 >> scripts/batch/log/batch_17.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2950000 -e 3100000 >> scripts/batch/log/batch_18.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3100000 -e 3250000 >> scripts/batch/log/batch_19.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3250000 -e 3400000 >> scripts/batch/log/batch_20.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3400000 -e 3550000 >> scripts/batch/log/batch_21.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3550000 -e 3700000 >> scripts/batch/log/batch_22.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3700000 -e 3850000 >> scripts/batch/log/batch_23.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3850000 -e 4000000 >> scripts/batch/log/batch_24.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4000000 -e 4150000 >> scripts/batch/log/batch_25.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4150000 -e 4300000 >> scripts/batch/log/batch_26.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4300000 -e 4450000 >> scripts/batch/log/batch_27.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4450000 -e 4600000 >> scripts/batch/log/batch_28.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4600000 -e 4750000 >> scripts/batch/log/batch_29.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4750000 -e 4900000 >> scripts/batch/log/batch_30.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4900000 -e 5050000 >> scripts/batch/log/batch_31.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 5050000 -e 5200000 >> scripts/batch/log/batch_32.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 5200000 -e 5350000 >> scripts/batch/log/batch_33.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 5350000 -e 5500000 >> scripts/batch/log/batch_34.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 5500000 -e 5650000 >> scripts/batch/log/batch_35.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 5650000 -e 5800000 >> scripts/batch/log/batch_36.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 5800000 -e 5950000 >> scripts/batch/log/batch_37.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 5950000 -e 6100000 >> scripts/batch/log/batch_38.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 6100000 -e 6250000 >> scripts/batch/log/batch_39.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 6250000 -e 6400000 >> scripts/batch/log/batch_40.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 6400000 -e 6550000 >> scripts/batch/log/batch_41.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 6550000 -e 6700000 >> scripts/batch/log/batch_42.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 6700000 -e 6850000 >> scripts/batch/log/batch_43.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 6850000 -e 7000000 >> scripts/batch/log/batch_44.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 7000000 -e 7900000 >> scripts/batch/log/batch_45.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 25900000 -e 26500000 >> scripts/batch/log/batch_46.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 26500000 -e 27100000 >> scripts/batch/log/batch_47.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 27100000 -e 27700000 >> scripts/batch/log/batch_48.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 27700000 -e 28300000 >> scripts/batch/log/batch_49.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 28300000 -e 28900000 >> scripts/batch/log/batch_50.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 28900000 -e 29500000 >> scripts/batch/log/batch_51.log 2>&1',

]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()