# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 1000 -e 100000 >> scripts/batch/log/batch_00.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 100000 -e 200000 >> scripts/batch/log/batch_01.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 200000 -e 300000 >> scripts/batch/log/batch_02.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 300000 -e 400000 >> scripts/batch/log/batch_03.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 400000 -e 500000 >> scripts/batch/log/batch_04.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 500000 -e 600000 >> scripts/batch/log/batch_05.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 600000 -e 700000 >> scripts/batch/log/batch_06.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 700000 -e 800000 >> scripts/batch/log/batch_07.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 800000 -e 900000 >> scripts/batch/log/batch_08.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 900000 -e 1000000 >> scripts/batch/log/batch_09.log 2>&1',
'node dist/scripts/Non-Lambda/MergeMediaAndPatchInfoboxes.js -s 1000000 -e 1100000 >> scripts/batch/log/batch_10.log 2>&1',
]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()