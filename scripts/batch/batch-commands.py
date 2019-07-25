# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_00" >> scripts/batch/log/batch_00.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_01" >> scripts/batch/log/batch_01.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_02" >> scripts/batch/log/batch_02.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_03" >> scripts/batch/log/batch_03.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_04" >> scripts/batch/log/batch_04.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_05" >> scripts/batch/log/batch_05.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_06" >> scripts/batch/log/batch_06.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_07" >> scripts/batch/log/batch_07.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_08" >> scripts/batch/log/batch_08.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_09" >> scripts/batch/log/batch_09.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_10" >> scripts/batch/log/batch_10.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_11" >> scripts/batch/log/batch_11.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_12" >> scripts/batch/log/batch_12.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_13" >> scripts/batch/log/batch_13.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_14" >> scripts/batch/log/batch_14.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_15" >> scripts/batch/log/batch_15.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_16" >> scripts/batch/log/batch_16.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_17" >> scripts/batch/log/batch_17.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_18" >> scripts/batch/log/batch_18.log 2>&1',
'node dist/scripts/Non-Lambda/Make-WebP-Images.js --input "../../../scripts/batch/inputs/batch_19" >> scripts/batch/log/batch_19.log 2>&1',
]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()