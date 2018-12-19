import { Module } from '@nestjs/common';
import { EosClientService } from './eos-client.service';
import { CommonModule } from './../../common';
import { DatabaseModule } from '../database';

/**
 * Module containing EOS subscription logic via Dfuse
 */
@Module({
    imports: [CommonModule, DatabaseModule],
    providers: [EosClientService]
})
export class EosClientModule {}
