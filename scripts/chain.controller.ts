//import { Controller, Body, Post, Get, Param, Query } from '@nestjs/common';
//import { ApiOperation, ApiTags, ApiQuery, ApiParam  } from '@nestjs/swagger';
//import { ChainService } from './chain.service';
//
//@Controller('v2/chain')
//@ApiTags('Chain')
//export class ChainController {
//    constructor(private readonly chainService: ChainService) {}
//
//    @Get('epactions/:contract')
//    @ApiOperation({
//        title: 'Catch-up endpoint for Everipedia chain actions',
//        description: 'Get all the actions for a specific contract from the last sync point'
//    })
//    @ApiParam({
//        name: 'contract',
//        description: 'the contract to search. everipediaiq or eparticlectr',
//    })
//    @ApiQuery({
//        name: 'since',
//        description: 'the block number from which to start grabbing actions',
//        required: true
//    })
//    async getEpActions(@Param('contract') contract, @Query('since') since): Promise<any> {
//        since = Number(since);
//        return this.chainService.getEpActions(contract, since);
//    }
//
//    @Get('get_info')
//    @ApiOperation({
//        title: 'Get Chain Info',
//        description: `
//            A drop-in replacement for the EOS HTTP Chain API get_info endpoint.
//            Details for using the endpoint can be found at https://developers.eos.io/eosio-nodeos/reference#get_info`
//    })
//    async getInfo(@Body() body): Promise<any> {
//        return this.chainService.forward('get_info', body);
//    }
//
//    @Post('push_transaction')
//    @ApiOperation({
//        title: 'Guaranteed transaction execution',
//        description: `
//            An improved version of the EOS HTTP API push_transaction endpoint that offers guaranteed transaction execution.
//            This is a slow endpoint that does not return until the transaction has been included in a block.
//            Details for using the endpoint can be found at https://developers.eos.io/eosio-nodeos/reference#push_transaction.`
//    })
//    async pushTransaction(@Body() transaction): Promise<any> {
//        return this.chainService.pushTransaction(transaction);
//    }
//
//    @Post(':eos_api_endpoint')
//    @ApiOperation({
//        title: 'EOS Chain API',
//        description: `
//            A drop-in replacement for the EOS HTTP Chain API.
//            Details for using the endpoint can be found at https://developers.eos.io/eosio-nodeos/reference`
//    })
//    async forward(@Param('eos_api_endpoint') eos_api_endpoint, @Body() body): Promise<any> {
//        return this.chainService.forward(eos_api_endpoint, body);
//    }
//}
