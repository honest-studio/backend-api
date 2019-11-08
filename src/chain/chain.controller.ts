import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { ChainService } from './chain.service';

@Controller('v1/chain')
@ApiUseTags('Chain')
export class ChainController {
    constructor(private readonly chainService: ChainService) {}

    @Get('get_info')
    @ApiOperation({
        title: 'Get Chain Info',
        description: `
            A drop-in replacement for the EOS HTTP Chain API get_info endpoint.
            Details for using the endpoint can be found at https://developers.eos.io/eosio-nodeos/reference#get_info`
    })
    async getInfo(@Body() body): Promise<any> {
        return this.chainService.forward('get_info', body);
    }

    @Post('sign')
    @ApiOperation({
        title: 'Guaranteed transaction execution',
        description: `
            Sign a transaction with evrpdcronjob account. Use it to pay for a user's CPU. 
            The 'Content-Type: application/json' header must be set to use this endpoint.
            The body format is the same as https://developers.eos.io/eosio-nodeos/reference#push_transaction.`
    })
    async sign(@Body() transaction): Promise<any> {
        return this.chainService.sign(transaction);
    }

    @Post('get_table_rows')
    @ApiOperation({
        title: 'Get table rows',
        description: `
            Returns an object containing rows from the specified table.
            The 'Content-Type: application/json' header must be set to use this endpoint.
            Details for using the endpoint can be found at https://developers.eos.io/eosio-nodeos/reference#get_table_rows.`
    })
    async getTableRows(@Body() body): Promise<any> {
        return this.chainService.getTableRows(body);
    }

    @Post(':eos_api_endpoint')
    @ApiOperation({
        title: 'EOS Chain API',
        description: `
            A drop-in replacement for the EOS HTTP Chain API.
            The 'Content-Type: application/json' header must be set to use this endpoint.
            Details for using the endpoint can be found at https://developers.eos.io/eosio-nodeos/reference`
    })
    async forward(@Param('eos_api_endpoint') eos_api_endpoint, @Body() body): Promise<any> {
        return this.chainService.forward(eos_api_endpoint, body);
    }
}
