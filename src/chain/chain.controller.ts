import { Controller, Body, Post, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiUseTags } from '@nestjs/swagger';
import { ChainService } from './chain.service';

@Controller('v1/chain')
@ApiUseTags('Chain')
export class ChainController {
    constructor(private readonly chainService: ChainService) {}

    @Post('push_transaction')
    @ApiOperation({
        title: 'Guaranteed transaction execution',
        description: `
            An improved version of the EOS HTTP API push_transaction endpoint that offers guaranteed transaction execution.
            This is a slow endpoint that does not return until the transaction has been included in a block.
            Details for using the endpoint can be found at https://developers.eos.io/eosio-nodeos/reference#push_transaction.`
    })
    async pushTransaction(@Body() transaction): Promise<any> {
        return this.chainService.pushTransaction(transaction);
    }

    @Get(':get_info')
    @ApiOperation({
        title: 'Get Chain Info',
        description: `
            A drop-in replacement for the EOS HTTP Chain API get_info endpoint.
            Details for using the endpoint can be found at https://developers.eos.io/eosio-nodeos/reference#get_info`
    })
    async getInfo(@Body() body): Promise<any> {
        return this.chainService.forward('get_info', body);
    }

    @Post(':eos_api_endpoint')
    @ApiOperation({
        title: 'Get contract ABI',
        description: `
            A drop-in replacement for the EOS HTTP Chain API.
            Details for using the endpoint can be found at https://developers.eos.io/eosio-nodeos/reference`
    })
    async forward(@Param('eos_api_endpoint') eos_api_endpoint, @Body() body): Promise<any> {
        return this.chainService.forward(eos_api_endpoint, body);
    }
}
