import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { ChainService } from './chain.service';

@Controller('v1/chain')
@ApiTags('Chain')
export class ChainController {
    constructor(private readonly chainService: ChainService) {}

    @Get('get_info')
    @ApiOperation({
        summary: 'Get Chain Info',
        description: `
            A drop-in replacement for the EOS HTTP Chain API get_info endpoint.
            Details for using the endpoint can be found at https://developers.eos.io/eosio-nodeos/reference#get_info`
    })
    async getInfo(@Body() body): Promise<any> {
        return this.chainService.forward('get_info', body);
    }

    @Post('sign')
    @ApiOperation({
        summary: 'Pay-for-CPU signing utility',
        description: `
            Sign a transaction with evrpdcronjob account. Use it to pay for a user's CPU. 
            The 'Content-Type: application/json' header must be set to use this endpoint.`
    })
    @ApiBody({
        description: `The chain ID for the EOSIO chain you want to use. 
            Ex: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906" for EOS mainnet`,
        type: String,
        required: true
    })
    @ApiBody({
        description: `The serialized transaction as a Buffer object. 
            Ex: { type: "Buffer", data: [123,234,...] }`,
        type: Buffer,
        required: true
    })
    async sign(@Body() transaction): Promise<any> {
        return this.chainService.sign(transaction);
    }

    @Post('get_table_rows')
    @ApiOperation({
        summary: 'Get table rows',
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
        summary: 'EOS Chain API',
        description: `
            A drop-in replacement for the EOS HTTP Chain API.
            The 'Content-Type: application/json' header must be set to use this endpoint.
            Details for using the endpoint can be found at https://developers.eos.io/eosio-nodeos/reference`
    })
    async forward(@Param('eos_api_endpoint') eos_api_endpoint, @Body() body): Promise<any> {
        return this.chainService.forward(eos_api_endpoint, body);
    }
}
