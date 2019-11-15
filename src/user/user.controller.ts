import { Controller, Get, Post, Body, Param, Query, UsePipes } from '@nestjs/common';
import { ApiImplicitParam, ApiImplicitBody, ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { JoiValidationPipe } from '../common';
import { UserQuerySchema } from './user.query-schema';
import { UserService } from './user.service';
import { BoostsByUserReturnPack } from '../types/api';

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

    @Get(':eos_account_name/boosts')
    @ApiOperation({ title: 'Get boosts for a user' })
    @ApiImplicitParam({
        name: 'eos_account_name',
        description: `Max 12-char EOS account name
            Example: kedartheiyer`
    })
    @ApiResponse({
        status: 200,
        description: `returns an array of boosts`
    })
    async getBoostsByUser(@Param('eos_account_name') eos_account_name): Promise<BoostsByUserReturnPack> {
        return this.userService.getBoostsByUser(eos_account_name);
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

    @Post('streaks')
    @ApiOperation({
        title: 'Deprecated'
    })
    async getStreaks(@Body() users): Promise<any> {
        return this.userService.getProfiles(users);
    }

    @Post('profiles')
    @ApiOperation({
        title: 'Get user info',
        description: `Body format: An array of users. Example:
            ["kedartheiyer", "eosiochicken"]`
    })
    @ApiResponse({
        status: 201,
        description: `Array of objects, one for each user:
            {
                current: Current editing streak for user,
                best: Longest historical editing streak for user,
                profile: User profile if it exists. null if not,
                edits: total number of edits user has made
            }`
    })
    async getProfiles(@Body() users): Promise<any> {
        return this.userService.getProfiles(users);
    }

    @Get(':eos_account_name/profile')
    @ApiOperation({ title: 'Get miscellaneous stats for a user' })
    @ApiImplicitParam({
        name: 'eos_account_name',
        description: `Max 12-char EOS account name
        Example: kedartheiyer`
    })
    async getProfile(@Param('eos_account_name') eos_account_name): Promise<any> {
        return this.userService.getProfile(eos_account_name);
    }
}
