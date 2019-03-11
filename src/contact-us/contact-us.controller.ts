import { Body, Controller, Post, Param, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiResponse, ApiImplicitParam, ApiUseTags } from '@nestjs/swagger';
import { ContactUsService } from './contact-us.service';
import { ContactUSDto } from './contact-us-dto';

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
    @ApiConsumes('multipart/form-data')
    @ApiImplicitParam({
        name: 'contact_date',
        required: true,
        description: 'The date'
    })
    @ApiImplicitParam({
        name: 'contact_text',
        required: true,
        description: 'The text of the contact us form'
    })
    @ApiImplicitParam({
        name: 'contact_email',
        required: true,
        description: 'The email of the submitter'
    })
    @ApiImplicitParam({
        name: 'contact_subject',
        required: true,
        description: 'Subject'
    })
    @ApiImplicitParam({
        name: 'contact_type',
        required: true,
        description: 'The type of contact'
    })
    @ApiImplicitParam({
        name: 'contact_ip',
        required: true,
        description: 'IP address of the contact'
    })
    @ApiImplicitParam({
        name: 'contact_useragent',
        required: true,
        description: 'The user agent'
    })
    async submitContactUsForm(@Body(new ValidationPipe()) form: ContactUSDto): Promise<any> {
        return await this.contactUsService.submitContactUsForm(form);
    }
}
