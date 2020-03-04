import { Controller, Get } from '@nestjs/common';
import { IpfsService } from '../common/ipfs-service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('v2/status')
@ApiTags('Status')
export class StatusController {
    constructor(private readonly ipfsLocal: IpfsService) {}

    @Get('ipfs')
    @ApiOperation({ 
        summary: 'IPFS status', 
        description: 'Returns 200 if working, 500 if not'
    })
    async ipfs(): Promise<boolean> {
        return this.ipfsLocal.test();
    }

}
