export const legalData = [
  {
    id: "terms-conditions",
    title: "1. Terms & Conditions",
    emoji: "⭐",
    effectiveDate: "June 19, 2026",
    lastUpdated: "June 19, 2026",
    content: `
      <h3>1. Introduction & Acceptance of Terms</h3>
      <p>Welcome to <strong>PharmaERP</strong>, a premium cloud and offline-mode capable Medical ERP and Barcode Management System software developed and owned by <strong>DevSamp Technologies</strong> (hereafter referred to as "Company", "We", "Us", or "Our").</p>
      <p>This License Agreement ("Agreement") governs your activation, deployment, and use of the PharmaERP software platform, database modules, and associated cloud sync API services. By registering an account, scanning barcodes, completing purchase entries, or executing POS checkouts, you (the "User", "Client", "Retail Pharmacist") agree to be bound by all criteria listed in these Terms.</p>
      <p>This Agreement begins the moment you click "Register Account" or check the mandatory agreement boxes during signup, and remains active until terminated by either party or upon subscription expiration.</p>

      <h3>2. Definitions</h3>
      <ul>
        <li><strong>User:</strong> Any licensed medical shop, pharmacy retail owner, or authorized staff representative operating the software.</li>
        <li><strong>Account:</strong> The credentials, permissions set, and subscription profile created to access the ERP dashboard.</li>
        <li><strong>Subscription:</strong> The paid license package chosen to access cloud services, automated backups, and analytics.</li>
        <li><strong>Free Trial:</strong> The 7-day initial evaluation period granted to one distinct business unit.</li>
        <li><strong>Software & Service:</strong> The PharmaERP web application, components, database structure, and backup engines.</li>
        <li><strong>Admin & Customer:</strong> Admin refers to the business owner user; Customer refers to the pharmacy's end buyers.</li>
        <li><strong>Invoice & Medicine:</strong> The bills generated and stock items logged into the database.</li>
        <li><strong>Database & Cloud:</strong> Local Mongoose/MongoDB storage and remote backup cloud nodes.</li>
        <li><strong>Offline Mode:</strong> The PWA local-storage-backed queue that allows billing without active internet.</li>
        <li><strong>AI Feature:</strong> Automated stock analysis, pattern recognition, and telemetry results.</li>
        <li><strong>Premium Feature:</strong> Features limited to paid plans, such as WhatsApp automation and multi-device sessions.</li>
      </ul>

      <h3>3. Eligibility Criteria</h3>
      <p>To register an account or use PharmaERP, you must meet the following:
      <ul>
        <li>You must be at least 18 years of age or the legal age of majority in your jurisdiction.</li>
        <li>The software must be used strictly for commercial/business billing purposes (medical shops, clinics, wholesalers).</li>
        <li>Creation of fake accounts, mock registrations, or using false drug license credentials is strictly prohibited and subject to immediate deletion.</li>
      </ul>
      </p>

      <h3>4. User Responsibilities & Account Security</h3>
      <p>As a registered administrator, you agree to:
      <ul>
        <li>Maintain absolute confidentiality of your account credentials (username, password, OTP sessions). You are responsible for all entries made under your login.</li>
        <li>Ensure all medicine records, batch numbers, expiry dates, purchase rates, and distributor details entered into the system are 100% correct.</li>
        <li>Proactively download daily/weekly offline backups to your local storage to prevent data loss in the event of local hardware failure.</li>
        <li>Verify all GST/tax calculations, billing figures, and print outputs to ensure they comply with local taxation laws. The company is not responsible for tax mismatches.</li>
        <li>Verify medicine dosage, chemical names, and packaging before sellout. The pharmacist holds final liability for correct dispensation.</li>
      </ul>
      </p>

      <h3>5. Company Rights & Operations</h3>
      <p>DevSamp Technologies reserves the right to:
      <ul>
        <li>Suspend or permanently delete user accounts involved in illegal activities, fraudulent billing, or non-payment of subscription fees.</li>
        <li>Modify system features, pricing plans, and promotional offers at any time with prior notice.</li>
        <li>Schedule database and server maintenance windows. Downtime details are governed by the SLA.</li>
        <li>Discontinue, change, or terminate the 7-Day Free Trial program or any launch offers at our sole discretion.</li>
      </ul>
      </p>

      <h3>6. Software License & Proprietary Rights</h3>
      <p>PharmaERP is licensed, not sold. You receive a limited, revocable, non-transferable, and non-exclusive right to run the application interface on your local hardware.
      <ul>
        <li>The Source Code, UI Design, database architecture, and proprietary scripts are the intellectual property of DevSamp Technologies.</li>
        <li>You may not copy, modify, distribute, sell, or lease any part of our software or reverse engineer the code.</li>
        <li>DevSamp owns all brand trademarks, logos, custom icons, graphics, and system layouts.</li>
      </ul>
      </p>

      <h3>7. Acceptable Use Policy</h3>
      <p><strong>Allowed Operations:</strong> Standard pharmacy inventory logging, purchase tracking, barcode printing, credit ledger khata management, sales return tracking, and GST billing.
      <br/><br/>
      <strong>Prohibited Operations:</strong> Cracking software licenses, executing SQL injections or brute-force tests, running script bots for spam billing, performing money laundering through mock invoices, or using the software for illegal narcotic drug tracking without standard government prescriptions.</p>

      <h3>8. Limitation of Liability</h3>
      <p>DevSamp Technologies shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from:
      <ul>
        <li>Business interruption, profit loss, or medicine stock loss due to incorrect data entry.</li>
        <li>Electricity failures, local hardware crashes, internet drops, or thermal printer hardware jams.</li>
        <li>Third-party service drops, including WhatsApp messaging APIs, email delivery failure, or cloud database outages.</li>
        <li>Loss of local data if the user fails to download manual backups.</li>
      </ul>
      </p>

      <h3>9. Indemnification</h3>
      <p>You agree to indemnify and hold harmless DevSamp Technologies, its directors, and developers from any legal claims, liabilities, damages, or costs arising out of your illegal activities, GST calculation fraud, distribution of banned drugs, or violating pharmacy licensing laws using the platform.</p>

      <h3>10. Governing Law & Jurisdiction</h3>
      <p>These terms are governed by the laws of India. Any legal actions, conflicts, or claims arising out of this software license must be resolved exclusively within the courts of our registered corporate location in India.</p>

      <h3>11. Account & Data Deletion</h3>
      <p>Users have the right to terminate this agreement at any time by requesting deletion of their data or their entire user ID/profile. Due to the high risk of malicious deletion or data loss, these actions require authentication via a One-Time Password (OTP) sent to the registered email address. Once verified, all associated tenant data (medicines, invoices, distributors, active sessions) will be instantly and permanently purged from active databases.</p>

      <h3>12. Changes in Terms</h3>
      <p>Company reserves the right to update these terms at any time. Active users will receive a dashboard alert. Continued usage of the software after changes are published constitutes agreement to the updated Terms.</p>
    `
  },
  {
    id: "privacy-policy",
    title: "2. Privacy Policy",
    emoji: "🔒",
    effectiveDate: "June 19, 2026",
    lastUpdated: "June 19, 2026",
    content: `
      <h3>1. Data We Collect</h3>
      <p>To run the ERP successfully, we collect the following categories of data:</p>
      <ul>
        <li><strong>Account Information:</strong> Owner Name, Phone Number, Email Address, Pharmacy Shop Name, Address, Drug License Number (if applicable), and GSTIN.</li>
        <li><strong>Operational Data:</strong> Medicine details (Name, Batch, Expiry, Cost, Rack), distributor contact directory, purchase logs, sales transactions, and khata ledger balances.</li>
        <li><strong>Device Analytics:</strong> Browser type, Operating System, active sessions list, client IP Address, and system logs.</li>
        <li><strong>Authentication Identifiers:</strong> Password hashes, login session tokens, and security OTP records.</li>
      </ul>

      <h3>2. How We Use Your Data</h3>
      <p>Your data is processed strictly for:
      <ul>
        <li>Generating invoices and tax reports.</li>
        <li>Enabling Cloud Sync and automated remote database backups.</li>
        <li>Sending WhatsApp billing notifications and credit reminders on your request.</li>
        <li>Providing pharmacist support, debugging system crashes, and improving search indexing.</li>
        <li>Verifying active license status and active device sessions.</li>
      </ul>
      </p>

      <h3>3. Data Sharing Restrictions</h3>
      <p><strong>DevSamp Technologies does not, under any circumstances, sell, rent, or trade your inventory, sales, or customer data to third-party marketing companies.</strong> Data is shared only with trusted operational providers:
      <ul>
        <li>Secure cloud database infrastructure providers (hosting services).</li>
        <li>Communication services (WhatsApp API and SMTP Email delivery platforms) when you trigger receipts.</li>
        <li>Secure payment gateway processors when you pay subscription fees.</li>
        <li>Law enforcement agencies, strictly if forced by an official government order under governing Indian IT Acts.</li>
      </ul>
      </p>

      <h3>4. Security & Encryption Standards</h3>
      <p>We use modern security measures to secure your data:
      <ul>
        <li>SSL/TLS encryption for all cloud interactions.</li>
        <li>Industry-standard password hashing algorithms (bcrypt).</li>
        <li>Secure JWT session tokens for authentication.</li>
        <li>OTP (One-Time Password) verification protocols for crucial account profile modifications.</li>
      </ul>
      </p>

      <h3>5. Data Retention & Deletion</h3>
      <p>Your account records and database logs are kept active during the duration of your active subscription. If you cancel your account or send a data deletion request:
      <ul>
        <li>All operational logs, inventory records, and sales history will be marked for deletion.</li>
        <li>The system will permanently purge all database records within 90 days of account closure (Grace Period to retrieve data).</li>
        <li>Automated backup archives will be overwritten and purged within 180 days.</li>
      </ul>
      </p>

      <h3>6. User Rights & Data Portability</h3>
      <p>You have the absolute right to:
      <ul>
        <li><strong>Right to Portability:</strong> Export and download your entire database in JSON format, or download standard, print-ready PDF summaries of all your stock, distributors, and invoices for pen-and-paper operations at any time.</li>
        <li><strong>Right to Erasure (Forgotten):</strong> Permanently purge all your inventory and sales data, or delete your entire account. For security, data/account deletion requires email verification OTP sent to your registered Gmail address.</li>
        <li>Request correction or updates to your registered business email, address, or phone number.</li>
      </ul>
      </p>

      <h3>7. Children's Privacy</h3>
      <p>PharmaERP is designed strictly for commercial business users. Registration by individuals under 13 years of age is not permitted. We do not knowingly collect child demographics.</p>
    `
  },
  {
    id: "subscription-billing",
    title: "3. Subscription & Billing Policy",
    emoji: "💳",
    effectiveDate: "June 19, 2026",
    lastUpdated: "June 19, 2026",
    content: `
      <h3>1. 7-Day Free Trial Policy</h3>
      <p>We offer a 7-Day Free Trial to new customers.
      <ul>
        <li>Only one Free Trial is permitted per distinct business unit, device, or GSTIN.</li>
        <li>Creation of duplicate accounts, fake email registrations, or mock phone verification profiles to abuse trials is strictly blocked.</li>
      </ul>
      </p>

      <h3>2. Launch Offer Rules</h3>
      <p>Special promotional trial extensions or monthly waivers for the first 100 signups require:
      <ul>
        <li>Submission of original video feedback (minimum 30 seconds to 1-minute length).</li>
        <li>The video feedback must feature original voice narration (no automated AI voiceovers or synthetic edits).</li>
        <li>Approval is subject to company verification; the decision of DevSamp Technologies is final.</li>
      </ul>
      </p>

      <h3>3. Standard Pricing & Plan Structure</h3>
      <p>Standard subscription pricing for PharmaERP is set at <strong>₹499 per month</strong> (subject to applicable taxes). Price adjustments may occur in the future with a minimum of 30 days advance notice to active subscribers.</p>

      <h3>4. Payment Methods & Verification</h3>
      <p>We accept payments via:
      <ul>
        <li>Unified Payments Interface (UPI - GPay, PhonePe, Paytm).</li>
        <li>Credit/Debit Cards (Visa, Mastercard, RuPay).</li>
        <li>Net Banking and online wallet services.</li>
      </ul>
      <p>Subscriptions will be credited to accounts only after transaction verification is completed by the payment processor.</p>
      </p>

      <h3>5. Expiry & Account Lock Logic</h3>
      <p>When the subscription validity period terminates:
      <ul>
        <li>The application interface will automatically redirect to the <code>/paused</code> (Subscription Suspended) page.</li>
        <li>Access to POS billing, purchase logging, reports, and search finders will be locked.</li>
        <li>Your database is preserved safely. No data is deleted immediately upon expiry, allowing you to renew and resume operations at any time.</li>
      </ul>
      </p>
    `
  },
  {
    id: "refund-cancellation",
    title: "4. Refund & Cancellation Policy",
    emoji: "↩️",
    effectiveDate: "June 19, 2026",
    lastUpdated: "June 19, 2026",
    content: `
      <h3>1. General No-Refund Policy</h3>
      <p>Once a subscription billing transaction is successfully processed and the license months are credited to your account, <strong>no refunds (partial or full) will be granted</strong>. The client is encouraged to use the 7-Day Free Trial to test hardware compatibility and software features before making a payment.</p>

      <h3>2. Double / Wrong Payments</h3>
      <ul>
        <li>In the event of duplicate transactions (where payment is deducted twice for the same billing period), the extra amount will be automatically adjusted as credits to extend the next billing cycle.</li>
        <li>Payment failure cases where money is deducted from your bank but not credited to the ERP will be refunded automatically by your bank within 5–7 working days as per standard banking guidelines.</li>
      </ul>

      <h3>3. Subscription Cancellation</h3>
      <p>You can cancel your subscription at any time. Cancellation stops future automatic renewals. Your access to the software will remain active until the end of your current paid billing period.</p>

      <h3>4. Company-Initiated Cancellations</h3>
      <p>DevSamp Technologies reserves the right to cancel your license immediately without refund if you are found guilty of:
      <ul>
        <li>Software cracking, license bypass, or reverse engineering attempts.</li>
        <li>Using the system to generate fraudulent tax invoices or sell banned/narcotic substances without prescription logs.</li>
      </ul>
      </p>
    `
  },
  {
    id: "launch-offer",
    title: "5. Launch Offer Rules",
    emoji: "🎁",
    effectiveDate: "June 19, 2026",
    lastUpdated: "June 19, 2026",
    content: `
      <h3>1. Eligibility & Scope</h3>
      <p>The PharmaERP Launch Offer is limited strictly to the <strong>first 100 customers</strong> who register and activate the software. This offer guarantees promotional benefits which may include monthly price discounts or free extension credits.</p>

      <h3>2. Feedback Criteria</h3>
      <p>To qualify for the promotional Month extension:
      <ul>
        <li>You must submit a video review showing your active pharmacy billing counter using the software.</li>
        <li>The video must be at least 30 seconds to 1 minute in length.</li>
        <li>The video must contain original audio narration in English or Hindi. Synthetic voiceovers, stock footage, or AI-generated reviews will lead to immediate disqualification.</li>
      </ul>
      </p>

      <h3>3. Terms of Expiry</h3>
      <p>This launch campaign will expire automatically as soon as 100 validated customers submit their approved reviews, or at the sole discretion of the management.</p>
    `
  },
  {
    id: "acceptable-use",
    title: "6. Acceptable Use Policy",
    emoji: "🛡️",
    effectiveDate: "June 19, 2026",
    lastUpdated: "June 19, 2026",
    content: `
      <h3>1. Allowed Uses</h3>
      <p>PharmaERP must be used strictly for:
      <ul>
        <li>Entering and tracking pharmacy stocks and distributors.</li>
        <li>Printing barcode labels for packaging.</li>
        <li>Executing customer transactions, calculating taxes, and logging credit details.</li>
        <li>Downloading standard sales reports and inventory logs.</li>
      </ul>
      </p>

      <h3>2. Prohibited Uses</h3>
      <p>You agree not to use the software to:
      <ul>
        <li>Perform high-volume automated bot logins or brute-force tests.</li>
        <li>Abuse the public API routes or execute SQL/NoSQL injection scripts.</li>
        <li>Generate fake GST invoices to evade taxation laws.</li>
        <li>Host cracked, pirated, or modified versions of the software.</li>
        <li>Extract medicine datasets from our system for competitor research.</li>
      </ul>
      </p>
    `
  },
  {
    id: "data-backup",
    title: "7. Data Backup Policy",
    emoji: "💾",
    effectiveDate: "June 19, 2026",
    lastUpdated: "June 19, 2026",
    content: `
      <h3>1. Backup Schedules</h3>
      <p>To ensure high database durability, we perform:
      <ul>
        <li><strong>Daily Cloud Backups:</strong> Automated snapshots of your active stock, sales log, and khata records.</li>
        <li><strong>Weekly Archives:</strong> Secure offsite storage to protect against local node failures.</li>
      </ul>
      </p>

      <h3>2. User-Triggered Manual Backups</h3>
      <p>We provide a dedicated download option in the profile settings tab. The user can export their entire database locally as a JSON file at any time.
      <br/><br/>
      <strong>Important Disclaimer:</strong> While we perform daily backups, the owner should download manual weekly backups. DevSamp is not liable for data loss caused by user-initiated database cleanup or computer hardware crashes.</p>

      <h3>3. Database Restore Operations</h3>
      <p>Users can upload their downloaded JSON backup file to restore their inventory. Doing so completely overwrites the current database state with the backup file data. This action is irreversible once executed.</p>
    `
  },
  {
    id: "support-policy",
    title: "8. Support Policy",
    emoji: "📞",
    effectiveDate: "June 19, 2026",
    lastUpdated: "June 19, 2026",
    content: `
      <h3>1. Support Hours</h3>
      <p>Our helpdesk is active from <strong>10:00 AM to 7:00 PM IST, Monday through Saturday</strong> (excluding public holidays).</p>

      <h3>2. Support Channels</h3>
      <ul>
        <li><strong>WhatsApp Support:</strong> Directly open chat support links from the platform.</li>
        <li><strong>Email Support:</strong> Send query logs to support@pharmaerp.com.</li>
        <li><strong>Remote Desktop Assistance:</strong> Staff may request remote desktop access (via secure screen sharing software like AnyDesk or TeamViewer) to configure thermal print settings.</li>
      </ul>

      <h3>3. Priority Matrix</h3>
      <p>Paid premium plan accounts receive prioritized support with guaranteed shorter response windows for critical bugs, printer jams, and billing issues.</p>
    `
  },
  {
    id: "security-policy",
    title: "9. Security Policy",
    emoji: "🔐",
    effectiveDate: "June 19, 2026",
    lastUpdated: "June 19, 2026",
    content: `
      <h3>1. Login Security</h3>
      <p>Access is secured using JWT authentication. Passwords must meet basic length criteria and are hashed using bcrypt before database storage.</p>

      <h3>2. OTP Verification Checks</h3>
      <p>For high-risk operations (such as updating owner email, changing passwords, or database overrides), the system mandates OTP code verification sent to the registered email address.</p>

      <h3>3. Active Device Sessions Management</h3>
      <p>The profile panel lists all logged-in devices with OS details, browser, IP address, and location metadata. Users can revoke active sessions of any device instantly to prevent unauthorized access.</p>
    `
  },
  {
    id: "disclaimer",
    title: "10. Disclaimer Page",
    emoji: "⚠️",
    effectiveDate: "June 19, 2026",
    lastUpdated: "June 19, 2026",
    content: `
      <h3>1. General Disclaimers</h3>
      <p>PharmaERP is a utility tool designed to help chemists manage inventory and generate bills.
      <ul>
        <li><strong>AI Output:</strong> AI predictions and inventory warnings are helper tools. Final decisions must be verified manually by the pharmacist.</li>
        <li><strong>GST Taxes:</strong> GST rates must be verified by the accountant. The software does not provide certified accounting advisory services.</li>
        <li><strong>Medicine Quality:</strong> DevSamp does not check dosage, drug combinations, or medicine expiry. Pharmacists must verify medicine packets before selling.</li>
        <li><strong>Printer & Scanner:</strong> Hardware compatibility depends on browser print configuration. The software is optimized for 50x25mm labels and standard barcode scanners.</li>
      </ul>
      </p>
    `
  },
  {
    id: "cookie-policy",
    title: "11. Cookie Policy",
    emoji: "🍪",
    effectiveDate: "June 19, 2026",
    lastUpdated: "June 19, 2026",
    content: `
      <h3>1. Use of Cookies</h3>
      <p>PharmaERP uses cookies and local browser storage objects to deliver a fast and personalized application workflow.</p>

      <h3>2. Essential Cookies</h3>
      <p>Mandatory for security and session state:
      <ul>
        <li>Keeping the user logged in between page reloads.</li>
        <li>Executing auto-logout safety timeouts.</li>
        <li>Tracking active device identifiers.</li>
      </ul>
      </p>

      <h3>3. Functional & Analytics Cookies</h3>
      <p>Used to store preferences:
      <ul>
        <li>Remembering printer column configurations and dark mode preferences.</li>
        <li>Logging crash reports and performance statistics to optimize loading speeds.</li>
      </ul>
      </p>
    `
  },
  {
    id: "dpa",
    title: "12. Data Processing Agreement (DPA)",
    emoji: "🤝",
    effectiveDate: "June 19, 2026",
    lastUpdated: "June 19, 2026",
    content: `
      <h3>1. Parties & Definitions</h3>
      <p>This DPA applies to B2B clients, wholesale distributors, and pharmacy chains.
      <ul>
        <li><strong>Data Controller:</strong> The retail pharmacy client (you) who defines inventory and customer records.</li>
        <li><strong>Data Processor:</strong> DevSamp Technologies (us) which manages servers, cloud databases, and queries.</li>
      </ul>
      </p>

      <h3>2. Processing Scope</h3>
      <p>We process medicine details, purchase logs, sale receipts, customer names, and contact details to generate analytics and keep stock logs synchronized.</p>

      <h3>3. Confidentiality Obligations</h3>
      <p>We implement strict access restrictions. No company employee has direct access to client sales records or credit accounts without written permission for support purposes.</p>
    `
  },
  {
    id: "sla",
    title: "13. Service Level Agreement (SLA)",
    emoji: "📈",
    effectiveDate: "June 19, 2026",
    lastUpdated: "June 19, 2026",
    content: `
      <h3>1. Target Service Uptime</h3>
      <p>We target a monthly cloud server uptime rate of **99.9%** (excluding scheduled system maintenance windows).</p>

      <h3>2. Scheduled Maintenance</h3>
      <p>Maintenance windows are scheduled during low-traffic periods (typically between 12:00 AM and 5:00 AM IST) with a minimum of 24 hours advance notice to administrators.</p>

      <h3>3. Incident Response Times</h3>
      <ul>
        <li><strong>Critical Issues (Server Down, Payment Failure):</strong> Response within 2 hours.</li>
        <li><strong>High Priority (Billing Block, Backup Failure):</strong> Response within 6 hours.</li>
        <li><strong>Normal/Low Priority (Design Tweak, Feature Request):</strong> Response within 24–48 hours.</li>
      </ul>
    `
  }
];
