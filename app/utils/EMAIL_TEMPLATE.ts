const DMCA_TEMPLATE = `
<h1>Content Removal Demand</h1>
<br/>
<br/>
This is a formal demand for the immediate removal of unauthorized intimate content from your website:
<br/>
Website: [WEBSITE NAME]
<br/>
URL: [SPECIFIC PAGE URL]
<br/>
Content in question:
<br/>
[Brief description without explicit details]

<br/>
<br/>
Our user has not authorized the posting, sharing, or distribution of:
<br/>
1. Any intimate/private images
<br/>
2. Their personal information (including name and email)
<br/>
<br/>

IMMEDIATE ACTIONS REQUIRED:
<br/>
1. Remove ALL unauthorized images
2. Delete ALL associated personal information
3. Confirm removal in writing within 24 hours
4. Block future uploads of this content

<br/>
<br/>

You are hereby notified that:
<br/>
- This content violates our user's privacy rights
- The content was shared without consent
- Our user owns all rights to their private content
- Distribution of such content may violate various state and federal laws

<br/>
<br/>

FAILURE TO COMPLY:
<br/>
If this content is not removed within 48 hours, we will:
1. Take immediate legal action
2. Report your website to relevant authorities
3. Contact your hosting provider and domain registrar
4. Pursue all available legal remedies
5. Hold you liable for all damages and legal costs

<br/>
<br/>


You can confirm removal by contacting:
<br/>
Mr/Mrs [Client Name]
<br/>
EMail: [YOUR CONTACT INFO]

<br/>
<br/>

Take notice that continued hosting of this content after receiving this notice may result in:
<br/>
- Criminal charges
- Civil litigation
- Statutory damages
- Punitive damages
- Legal fees

<br/>
This is your only warning before legal action commences.
<br/>
<br/>

Regards,
<br/>
Aman Chand
<br/>
Nirbhaya.org
<br/>
[DATE]
`;

const CYBER_BUREAU_TEMPLATE = `
<h1>Request for Immediate Action: Unauthorized Content Report</h1>
<br/>
<br/>
Respected CyberBureau,
<br/>
<br/>
This is a formal request for your immediate assistance regarding unauthorized intimate content hosted on the following website:
<br/>
Website: [WEBSITE NAME]
<br/>
URL: [SPECIFIC PAGE URL]
<br/>
Description:
<br/>
[Brief description without explicit details]
<br/>
<br/>
The content in question has been uploaded and shared without the explicit consent of the individual(s) depicted. It violates their privacy and may constitute a breach of applicable laws, including:
<br/>
1. Violation of personal privacy and data protection laws.
<br/>
2. Distribution of explicit or intimate images without consent.
<br/>
3. Potential harm to the mental and emotional well-being of the affected party.
<br/>
<br/>
**Details of the Affected Individual:**
<br/>
Name: [Client Name]
<br/>
Email: [YOUR CONTACT INFO]
<br/>
<br/>
**Immediate Actions Requested:**
<br/>
1. Investigate the reported content and ensure its immediate removal.
2. Take appropriate action against the responsible parties.
3. Provide us with an acknowledgment of receipt and a status update on this case.
<br/>
<br/>
We request your intervention to ensure that such content is removed and no further harm is caused. This matter is of an urgent and sensitive nature, and we kindly ask for swift action.
<br/>
<br/>
If you require any additional information or evidence, please do not hesitate to contact us directly at [YOUR CONTACT INFO].
<br/>
<br/>
Thank you for your attention and prompt assistance in this matter.
<br/>
<br/>
Sincerely,
<br/>
Aman Chand
<br/>
Nirbhaya.org
<br/>
[DATE]
`;

export default function EMAIL_TEMPLATE(
  ClientName: string,
  ClientEmail: string,
  WEBSITE_URL: string,
  IMAGE_URL: string,
  WEBSITE_NAME: string,
  TEMPLATE: string = DMCA_TEMPLATE
) {
  const template =
    TEMPLATE === 'CYBER_BUREAU_TEMPLATE'
      ? CYBER_BUREAU_TEMPLATE
      : DMCA_TEMPLATE;
  return template
    .replace('[WEBSITE NAME]', WEBSITE_NAME)
    .replace('[SPECIFIC PAGE URL]', WEBSITE_URL)
    .replace(
      '[Brief description without explicit details]',
      `Unauthorized intimate content: ${IMAGE_URL}`
    )
    .replace('[Client Name]', ClientName)
    .replace('[YOUR CONTACT INFO]', ClientEmail)
    .replace('[DATE]', new Date().toDateString());
}
