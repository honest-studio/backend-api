import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { CommonModule } from './../../common';
import { EosSyncService } from './eos-sync.service';

/**
 * Module containing EOS subscription logic via Dfuse
 */
@Module({
    imports: [CommonModule, DatabaseModule],
    providers: [EosSyncService]
})
export class EosClientModule {}
