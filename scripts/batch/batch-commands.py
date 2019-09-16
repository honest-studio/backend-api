# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1 -e 200000 >> scripts/batch/log/batch_00.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 200000 -e 300000 >> scripts/batch/log/batch_01.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 300000 -e 400000 >> scripts/batch/log/batch_02.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 400000 -e 500000 >> scripts/batch/log/batch_03.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 500000 -e 600000 >> scripts/batch/log/batch_04.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 600000 -e 700000 >> scripts/batch/log/batch_05.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 700000 -e 800000 >> scripts/batch/log/batch_06.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 800000 -e 900000 >> scripts/batch/log/batch_07.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 900000 -e 1000000 >> scripts/batch/log/batch_08.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1000000 -e 1100000 >> scripts/batch/log/batch_09.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1100000 -e 1200000 >> scripts/batch/log/batch_10.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1200000 -e 1300000 >> scripts/batch/log/batch_11.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1300000 -e 1400000 >> scripts/batch/log/batch_12.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1400000 -e 1500000 >> scripts/batch/log/batch_13.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1500000 -e 1600000 >> scripts/batch/log/batch_14.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1600000 -e 1700000 >> scripts/batch/log/batch_15.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1700000 -e 1800000 >> scripts/batch/log/batch_16.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1800000 -e 1900000 >> scripts/batch/log/batch_17.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1900000 -e 2000000 >> scripts/batch/log/batch_18.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2000000 -e 2100000 >> scripts/batch/log/batch_19.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2100000 -e 2200000 >> scripts/batch/log/batch_20.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2200000 -e 2300000 >> scripts/batch/log/batch_21.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2300000 -e 2400000 >> scripts/batch/log/batch_22.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2400000 -e 2500000 >> scripts/batch/log/batch_23.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2500000 -e 2600000 >> scripts/batch/log/batch_24.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2600000 -e 2700000 >> scripts/batch/log/batch_25.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2700000 -e 2800000 >> scripts/batch/log/batch_26.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2800000 -e 2900000 >> scripts/batch/log/batch_27.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2900000 -e 3000000 >> scripts/batch/log/batch_28.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3000000 -e 3100000 >> scripts/batch/log/batch_29.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3100000 -e 3200000 >> scripts/batch/log/batch_30.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3200000 -e 3300000 >> scripts/batch/log/batch_31.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3300000 -e 3400000 >> scripts/batch/log/batch_32.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3400000 -e 3500000 >> scripts/batch/log/batch_33.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3500000 -e 3600000 >> scripts/batch/log/batch_34.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3600000 -e 3700000 >> scripts/batch/log/batch_35.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3700000 -e 3800000 >> scripts/batch/log/batch_36.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3800000 -e 3900000 >> scripts/batch/log/batch_37.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 3900000 -e 4000000 >> scripts/batch/log/batch_38.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4000000 -e 4100000 >> scripts/batch/log/batch_39.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4100000 -e 4200000 >> scripts/batch/log/batch_40.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4200000 -e 4300000 >> scripts/batch/log/batch_41.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4300000 -e 4400000 >> scripts/batch/log/batch_42.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4400000 -e 4500000 >> scripts/batch/log/batch_43.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4500000 -e 4600000 >> scripts/batch/log/batch_44.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4600000 -e 4700000 >> scripts/batch/log/batch_45.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4700000 -e 4800000 >> scripts/batch/log/batch_46.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4800000 -e 4900000 >> scripts/batch/log/batch_47.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 4900000 -e 5000000 >> scripts/batch/log/batch_48.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 5000000 -e 5100000 >> scripts/batch/log/batch_49.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 5100000 -e 5200000 >> scripts/batch/log/batch_50.log 2>&1',
]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()