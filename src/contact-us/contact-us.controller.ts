import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiUseTags } from '@nestjs/swagger';
import { ContactUsService } from './contact-us.service';
import { ContactUSSchema } from './contact-us.query-schema';
import { JoiValidationPipe } from '../common';

@Controller('v2/contact-us')
@ApiUseTags('Contact Us')
export class ContactUsController {
    constructor(private readonly contactUsService: ContactUsService) {}

    @Post('/')
    @ApiOperation({ title: 'Submit a Contact Us form' })
    @ApiResponse({
        status: 200,
        description: `Success`
    })
    // NEED TO FIX THE VALIDATION HERE
    @UsePipes(new JoiValidationPipe(ContactUSSchema))
    async submitContactUsForm(@Body() inputJSON): Promise<any> {
        return await this.contactUsService.submitContactUsForm(inputJSON);
    }
}
