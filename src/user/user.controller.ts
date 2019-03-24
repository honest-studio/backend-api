import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags, ApiImplicitQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserQuerySchema } from './user.query-schema';
import { JoiValidationPipe } from '../common';

@Controller('v2/user')
@ApiUseTags('User')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get(':eos_account_name/stakes')
    @ApiOperation({ title: 'Get stakes for a user' })
    @ApiImplicitParam({
        name: 'eos_account_name',
        description: `Max 12-char EOS account name
            Example: kedartheiyer`
    })
    @ApiResponse({
        status: 200,
        description: `returns an array of staking actions`
    })
    @UsePipes(new JoiValidationPipe(UserQuerySchema, ['query']))
    async getStakes(@Param('eos_account_name') eos_account_name, @Query() query): Promise<any> {
        return this.userService.getStakes(eos_account_name, query);
    }

    @Get(':eos_account_name/rewards')
    @ApiOperation({ title: 'Get rewards and slashes for a user' })
    @ApiImplicitParam({
        name: 'eos_account_name',
        description: `Max 12-char EOS account name
        Example: kedartheiyer`
    })
    @ApiResponse({
        status: 200,
        description: `returns 
            {
                rewards: Array,
                slashes: Array
            }`
    })
    @UsePipes(new JoiValidationPipe(UserQuerySchema, ['query']))
    async getRewards(@Param('eos_account_name') eos_account_name, @Query() query): Promise<any> {
        return this.userService.getRewards(eos_account_name, query);
    }

    @Get(':eos_account_name/activity')
    @ApiOperation({ title: 'Get miscellaneous stats for a user' })
    @ApiImplicitParam({
        name: 'eos_account_name',
        description: `Max 12-char EOS account name
        Example: kedartheiyer`
    })
    @ApiResponse({
        status: 200,
        description: `returns 
            {
                votes: Array, 
                proposals: Array 
            }`
    })
    async getActivity(@Param('eos_account_name') eos_account_name): Promise<any> {
        return this.userService.getActivity(eos_account_name);
    }
}
