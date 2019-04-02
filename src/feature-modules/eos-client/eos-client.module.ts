import { Module } from '@nestjs/common';
import { EosSyncService } from './eos-sync.service';
import { CommonModule } from './../../common';
import { DatabaseModule } from '../database';

/**
 * Module containing EOS subscription logic via Dfuse
 */
@Module({
    imports: [CommonModule, DatabaseModule],
    providers: [EosSyncService]
})
export class EosClientModule {}
