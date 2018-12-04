import { Module } from '@nestjs/common';
import { EosClientService } from './eos-client.service';
import { CommonModule } from './../../common';

/**
 * Module containing EOS subscription logic via Dfuse
 */
@Module({
    imports: [CommonModule],
    providers: [EosClientService]
})
export class EosClientModule {}
