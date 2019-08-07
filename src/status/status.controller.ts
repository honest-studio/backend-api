import { Controller, Get } from '@nestjs/common';
import { IpfsService } from '../common/ipfs-service';
import { ApiOperation, ApiUseTags } from '@nestjs/swagger';

@Controller('v2/status')
@ApiUseTags('Status')
export class StatusController {
    constructor(private readonly ipfs: IpfsService) {}

    @Get('ipfs')
    @ApiOperation({ 
        title: 'IPFS status', 
        description: 'Returns 200 if working, 500 if not'
    })
    async ipfs(): Promise<boolean> {
        return this.ipfs.test();
    }

}
