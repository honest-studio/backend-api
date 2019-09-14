# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 1 -e 2600000 >> scripts/batch/log/batch_00.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 2600000 -e 5200000 >> scripts/batch/log/batch_01.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 5200000 -e 7800000 >> scripts/batch/log/batch_02.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 7800000 -e 10400000 >> scripts/batch/log/batch_03.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 10400000 -e 13000000 >> scripts/batch/log/batch_04.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 13000000 -e 15600000 >> scripts/batch/log/batch_05.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 15600000 -e 18200000 >> scripts/batch/log/batch_06.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 18200000 -e 20800000 >> scripts/batch/log/batch_07.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 20800000 -e 23400000 >> scripts/batch/log/batch_08.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 23400000 -e 26000000 >> scripts/batch/log/batch_09.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 26000000 -e 28600000 >> scripts/batch/log/batch_10.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 28600000 -e 31200000 >> scripts/batch/log/batch_11.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 31200000 -e 33800000 >> scripts/batch/log/batch_12.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 33800000 -e 36400000 >> scripts/batch/log/batch_13.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 36400000 -e 39000000 >> scripts/batch/log/batch_14.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 39000000 -e 41600000 >> scripts/batch/log/batch_15.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 41600000 -e 44200000 >> scripts/batch/log/batch_16.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 44200000 -e 46800000 >> scripts/batch/log/batch_17.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 46800000 -e 49400000 >> scripts/batch/log/batch_18.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 49400000 -e 52000000 >> scripts/batch/log/batch_19.log 2>&1',
'node dist/scripts/Wiki-Importer/Wiki-Import.js -s 52000000 -e 54600000 >> scripts/batch/log/batch_20.log 2>&1',





]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()