# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 1 -e 1000000 >> scripts/batch/log/batch_00.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 1000000 -e 2000000 >> scripts/batch/log/batch_01.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 2000000 -e 3000000 >> scripts/batch/log/batch_02.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 3000000 -e 4000000 >> scripts/batch/log/batch_03.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 4000000 -e 5000000 >> scripts/batch/log/batch_04.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 5000000 -e 6000000 >> scripts/batch/log/batch_05.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 6000000 -e 7000000 >> scripts/batch/log/batch_06.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 7000000 -e 8000000 >> scripts/batch/log/batch_07.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 8000000 -e 9000000 >> scripts/batch/log/batch_08.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 9000000 -e 10000000 >> scripts/batch/log/batch_09.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 10000000 -e 11000000 >> scripts/batch/log/batch_10.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 11000000 -e 12000000 >> scripts/batch/log/batch_11.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 12000000 -e 13000000 >> scripts/batch/log/batch_12.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 13000000 -e 14000000 >> scripts/batch/log/batch_13.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 14000000 -e 15000000 >> scripts/batch/log/batch_14.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 15000000 -e 16000000 >> scripts/batch/log/batch_15.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 16000000 -e 17000000 >> scripts/batch/log/batch_16.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 17000000 -e 18000000 >> scripts/batch/log/batch_17.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 18000000 -e 19000000 >> scripts/batch/log/batch_18.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 19000000 -e 20000000 >> scripts/batch/log/batch_19.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 20000000 -e 21000000 >> scripts/batch/log/batch_20.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 21000000 -e 22000000 >> scripts/batch/log/batch_21.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 22000000 -e 23000000 >> scripts/batch/log/batch_22.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 23000000 -e 24000000 >> scripts/batch/log/batch_23.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 24000000 -e 25000000 >> scripts/batch/log/batch_24.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 25000000 -e 26000000 >> scripts/batch/log/batch_25.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 26000000 -e 27000000 >> scripts/batch/log/batch_26.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 27000000 -e 28000000 >> scripts/batch/log/batch_27.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 28000000 -e 29000000 >> scripts/batch/log/batch_28.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 29000000 -e 30000000 >> scripts/batch/log/batch_29.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 30000000 -e 31000000 >> scripts/batch/log/batch_30.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 31000000 -e 32000000 >> scripts/batch/log/batch_31.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 32000000 -e 33000000 >> scripts/batch/log/batch_32.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 33000000 -e 34000000 >> scripts/batch/log/batch_33.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 34000000 -e 35000000 >> scripts/batch/log/batch_34.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 35000000 -e 36000000 >> scripts/batch/log/batch_35.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 36000000 -e 37000000 >> scripts/batch/log/batch_36.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 37000000 -e 38000000 >> scripts/batch/log/batch_37.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 38000000 -e 39000000 >> scripts/batch/log/batch_38.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 39000000 -e 40000000 >> scripts/batch/log/batch_39.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 40000000 -e 41000000 >> scripts/batch/log/batch_40.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 41000000 -e 42000000 >> scripts/batch/log/batch_41.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 42000000 -e 43000000 >> scripts/batch/log/batch_42.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 43000000 -e 44000000 >> scripts/batch/log/batch_43.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 44000000 -e 45000000 >> scripts/batch/log/batch_44.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 45000000 -e 46000000 >> scripts/batch/log/batch_45.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 46000000 -e 47000000 >> scripts/batch/log/batch_46.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 47000000 -e 48000000 >> scripts/batch/log/batch_47.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 48000000 -e 49000000 >> scripts/batch/log/batch_48.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 49000000 -e 50000000 >> scripts/batch/log/batch_49.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 50000000 -e 51000000 >> scripts/batch/log/batch_50.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 51000000 -e 52000000 >> scripts/batch/log/batch_51.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 52000000 -e 53000000 >> scripts/batch/log/batch_52.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 53000000 -e 54000000 >> scripts/batch/log/batch_53.log 2>&1',
'node --max-old-space-size=2500 dist/scripts/Non-Lambda/Page-Categorizer-Birthdays.js -s 54000000 -e 55000000 >> scripts/batch/log/batch_54.log 2>&1',


]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()