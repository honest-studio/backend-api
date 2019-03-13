import { Injectable } from '@nestjs/common';
import { ConfigService } from '../common';
import { MysqlService, AWSSESService } from '../feature-modules/database';

@Injectable()
export class ContactUsService {
    constructor(private mysql: MysqlService, private awsSESService: AWSSESService) {}
    async submitContactUsForm(inputJSON): Promise<any> {
        // Construct the HTML
        const HTMLBody = `Contact Type: ${inputJSON.contacttype}<br><br>Message:<br>------------------------------<br>${inputJSON.contacttext}
        <br>------------------------------<br>Sender: ${inputJSON.contactname}<br>Email: ${inputJSON.contactemail}<br>
        IP: ${inputJSON.contactip}<br>User Agent: ${inputJSON.contactuseragent}`;

        // Create sendEmail params
        const emailParams = {
            Destination: {
                BccAddresses: ["theodor@everipedia.com", "christian@everipedia.com", "dave@everipedia.com", "navin@everipedia.com", 
                               "romi@everipedia.com"],
                ToAddresses: [this.awsSESService.getDefaultEmail(),]
            },
            Message: { 
                Body: { 
                    Html: {
                        Charset: "UTF-8",
                        Data: HTMLBody
                    },
                 },
                Subject: {
                    Charset: 'UTF-8',
                    Data: inputJSON.contactsubject
                }
            },
            Source: this.awsSESService.getDefaultEmail(),
            ReplyToAddresses: [this.awsSESService.getDefaultEmail(),],
        };

        // Send the email
        const sendPromise = this.awsSESService.sendEmail(emailParams).promise();

        // Handle promise's fulfilled/rejected states
        sendPromise.then(
            function(data) {
                console.log(data.MessageId);
        }).catch(
            function(err) {
                console.error(err, err.stack);
        });

        // Add the contact us entry to the database
        return new Promise((resolve, reject) => {
            this.mysql.pool().query(
                `INSERT INTO ebdb.enterlink_contact (contactdate, contacttext, contactemail, contactname, contactsubject, 
                    contacttype, contactip, contactuseragent) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
                [inputJSON.contactdate, inputJSON.contacttext, inputJSON.contactemail, inputJSON.contactname, inputJSON.contactsubject,
                    inputJSON.contacttype, inputJSON.contactip, inputJSON.contactuseragent],
                function(err, rows) {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
}
