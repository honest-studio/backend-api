# -*- coding: utf-8 -*-
from subprocess import Popen
import os

# 'export PYTHONIOENCODING=utf-8',
# split -l 25243 --numeric-suffixes --suffix-length=2 beee.txt batch_

commands = [
'export PYTHONIOENCODING=utf-8',
'node dist/scripts/Non-Lambda/Fix-Sentence-Splits.js -s 49690000 -e 4970000000 >> scripts/batch/log/batch_00.log 2>&1',
'node dist/scripts/Non-Lambda/Fix-Sentence-Splits.js -s 49700000 -e 4971000001 >> scripts/batch/log/batch_01.log 2>&1',
'node dist/scripts/Non-Lambda/Fix-Sentence-Splits.js -s 49710000 -e 4972000002 >> scripts/batch/log/batch_02.log 2>&1',
'node dist/scripts/Non-Lambda/Fix-Sentence-Splits.js -s 49720000 -e 4973000003 >> scripts/batch/log/batch_03.log 2>&1',
'node dist/scripts/Non-Lambda/Fix-Sentence-Splits.js -s 49730000 -e 4974000004 >> scripts/batch/log/batch_04.log 2>&1',
'node dist/scripts/Non-Lambda/Fix-Sentence-Splits.js -s 49740000 -e 4975000005 >> scripts/batch/log/batch_05.log 2>&1',
'node dist/scripts/Non-Lambda/Fix-Sentence-Splits.js -s 49750000 -e 4976000006 >> scripts/batch/log/batch_06.log 2>&1',
'node dist/scripts/Non-Lambda/Fix-Sentence-Splits.js -s 49760000 -e 4977000007 >> scripts/batch/log/batch_07.log 2>&1',
'node dist/scripts/Non-Lambda/Fix-Sentence-Splits.js -s 49770000 -e 4978000008 >> scripts/batch/log/batch_08.log 2>&1',
'node dist/scripts/Non-Lambda/Fix-Sentence-Splits.js -s 49780000 -e 4979000009 >> scripts/batch/log/batch_09.log 2>&1',
'node dist/scripts/Non-Lambda/Fix-Sentence-Splits.js -s 49790000 -e 4980000010 >> scripts/batch/log/batch_10.log 2>&1',
'node dist/scripts/Non-Lambda/Fix-Sentence-Splits.js -s 49800000 -e 4981000011 >> scripts/batch/log/batch_11.log 2>&1',
'node dist/scripts/Non-Lambda/Fix-Sentence-Splits.js -s 49810000 -e 4982000012 >> scripts/batch/log/batch_12.log 2>&1',
'node dist/scripts/Non-Lambda/Fix-Sentence-Splits.js -s 49820000 -e 4983000013 >> scripts/batch/log/batch_13.log 2>&1',

]
# run in parallel
processes = [Popen(cmd, shell=True) for cmd in commands]
# do other things here..
# wait for completion
for p in processes: p.wait()