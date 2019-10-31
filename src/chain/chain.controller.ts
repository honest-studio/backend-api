import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiUseTags, ApiImplicitParam, ApiImplicitQuery } from '@nestjs/swagger';
import { ChainService } from './chain.service';

@Controller('v2/chain')
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

    @Post('get_table_rows')
    @ApiOperation({
        title: 'Get table rows',
        description: `
            Returns an object containing rows from the specified table.
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
            Details for using the endpoint can be found at https://developers.eos.io/eosio-nodeos/reference`
    })
    async forward(@Param('eos_api_endpoint') eos_api_endpoint, @Body() body): Promise<any> {
        return this.chainService.forward(eos_api_endpoint, body);
    }

    @Get('epactions/:contract')
    @ApiOperation({
        title: 'Catch-up endpoint for Everipedia chain actions',
        description: `Get all the actions for a specific contract from the last sync point. There's a hard-coded limit of 100K actions per request, so you may have to run this multiple times with a new start block each time to get the full dataset`
    })
    @ApiImplicitParam({
        name: 'contract',
        description: 'the contract to search. everipediaiq or eparticlectr',
    })
    @ApiImplicitQuery({
        name: 'since',
        description: 'the block number from which to start grabbing actions',
        required: true
    })
    async getEpActions(@Param('contract') contract, @Query('since') since): Promise<any> {
        since = Number(since);
        return this.chainService.getEpActions(contract, since);
    }
}
