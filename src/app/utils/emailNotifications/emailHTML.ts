export const emailTemplate = (otp: any) => `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Madara  Email Verification</title>
    <style>
        /* Reset styles for email clients */
        body,
        table,
        td,
        p,
        a,
        li,
        blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }

        table,
        td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }

        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }

        /* Main styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #f8f9fa;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .email-header {
            padding: 40px 40px 30px 40px;
            text-align: center;
            background-color: #ffffff;
        }

        .company-logo {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            margin: 0 auto 30px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .logo-icon {
            color: white;
            font-size: 24px;
        }
      .logo-img{
        width: 100px;
      }

        .company-name {
            position: absolute;
            bottom: 8px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 12px;
            font-weight: 600;
        }

        .company-tagline {
            position: absolute;
            bottom: -2px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 8px;
            opacity: 0.8;
        }

        .email-content {
            padding: 0 40px 30px 40px;
            text-align: left;
        }

        .greeting {
            font-size: 16px;
            color: #2c3e50;
            margin: 0 0 20px 0;
            font-weight: 500;
        }

        .main-text {
            font-size: 16px;
            color: #5a6c7d;
            line-height: 1.6;
            margin: 0 0 20px 0;
        }

        .brand-highlight {
            color: #2c3e50;
            font-weight: 600;
        }

        .warning-text {
            font-size: 14px;
            color: #7f8c8d;
            line-height: 1.5;
            margin: 0 0 30px 0;
        }

        .verification-section {
            text-align: center;
            padding: 30px 0;
            background-color: #f8f9fa;
            border-radius: 8px;
            margin: 30px 0;
            position: relative;
        }

        .verification-label {
            font-size: 16px;
            color: #2c3e50;
            margin: 0 0 15px 0;
            font-weight: 600;
        }

        .verification-code {
            font-size: 36px;
            font-weight: 700;
            color: #2c3e50;
            letter-spacing: 3px;
            margin: 0 0 20px 0;
            font-family: 'Courier New', monospace;
            cursor: pointer;
        }

        .copy-button {
            display: inline-block;
            padding: 10px 25px;
            background-color: #2c3e50;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            border: none;
            position: relative;
        }

        .copy-button:hover {
            background-color: #34495e;
        }

        /* Tooltip styles */
        .tooltip {
            visibility: hidden;
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #34495e;
            color: white;
            font-size: 14px;
            padding: 5px 10px;
            border-radius: 5px;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }

        #confirmationMessage {
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #34495e;
            color: white;
            font-size: 14px;
            padding: 5px 10px;
            border-radius: 5px;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }

        .copy-button:hover .tooltip {
            visibility: visible;
            opacity: 1;
        }

        /* 
        .confirmation-message {
            display: none;
            font-size: 14px;
            color: green;
            margin-top: 10px;
        } */

        .social-section {
            padding: 30px 40px;
            text-align: center;
            border-top: 1px solid #ecf0f1;
        }

        .social-links {
            margin: 0 0 20px 0;
        }

        .social-link {
            display: inline-block;
            width: 40px;
            height: 40px;
            margin: 0 8px;
            background-color: #ecf0f1;
            border-radius: 50%;
            text-decoration: none;
            line-height: 40px;
            color: #7f8c8d;
            font-size: 16px;
            transition: background-color 0.3s ease;
        }

        .social-link:hover {
            background-color: #bdc3c7;
        }

        .social-link.facebook:hover {
            background-color: #3b5998;
            color: white;
        }

        .social-link.twitter:hover {
            background-color: #1da1f2;
            color: white;
        }

        .social-link.instagram:hover {
            background-color: #e4405f;
            color: white;
        }

        .social-link.youtube:hover {
            background-color: #ff0000;
            color: white;
        }

        .email-signature {
            text-align: center;
        }

        .signature-text {
            font-size: 16px;
            color: #2c3e50;
            margin: 0 0 5px 0;
        }

        .team-name {
            font-size: 14px;
            color: #7f8c8d;
            margin: 0;
        }

        /* Mobile responsive */
        @media only screen and (max-width: 600px) {

            .email-header,
            .email-content,
            .social-section {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }

            .company-logo {
                width: 100px;
                height: 100px;
            }

            .verification-code {
                font-size: 28px;
                letter-spacing: 2px;
            }

            .social-link {
                width: 35px;
                height: 35px;
                line-height: 35px;
                margin: 0 5px;
            }
        }
    </style>
</head>

<body>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
            <td style="padding: 20px 0;">
                 <!-- Header with Logo -->
                    <div class="email-header">
                        <div class="company-logo">
                            <div class="logo-icon">
                                <img class="logo-img" src="https://i.ibb.co.com/fz2b0VVG/madara-Logo.png" alt="logo" />
                            </div>
                        </div>
                    </div>


                    <!-- Email Content -->
                    <div class="email-content">
                        <p class="greeting">Hello User,</p>

                        <p class="main-text">
                            Thank you for choosing <span class="brand-highlight">Madara </span>. Use this OTP to
                            complete your Sign Up procedures and verify your account on <span
                                class="brand-highlight">Madara </span>.
                        </p>

                        <p class="warning-text">
                            Remember, Never share this OTP with anyone, not even if <span
                                class="brand-highlight">Madara </span> ask to you.
                        </p>

                        <!-- Verification Code Section -->
                        <div class="verification-section">
                            <p class="verification-label">Your verification code</p>
                            <div class="verification-code" id="verificationCode">${otp} <span class="tooltip">Click to Copy</span> </div>
                            <button class="copy-button" onclick="copyToClipboard("${otp}")">Copy
                                
                            </button>
                            <div id="confirmationMessage" class="confirmation-message">Code copied to clipboard!</div>
                        </div>
                    </div>

                    <!-- Social Links and Signature -->
                    <div class="social-section">
                        <div class="social-links">
                            <a href="#" class="social-link facebook">f</a>
                            <a href="#" class="social-link twitter">𝕏</a>
                            <a href="#" class="social-link instagram">📷</a>
                            <a href="#" class="social-link youtube">▶</a>
                        </div>

                        <div class="email-signature">
                            <p class="signature-text">Regards,</p>
                            <p class="team-name">Team <span class="brand-highlight">Madara </span>.</p>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <script>
        function copyToClipboard1(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(function () {
                    var confirmationMessage = document.getElementById("confirmationMessage");
                    confirmationMessage.style.visibility = "visible";
                    var confirmationMessage = document.getElementsByClassName("tooltip");
                    confirmationMessage.style.opacity = "0";
                    setTimeout(function () {
                        confirmationMessage.style.display = "none";
                    }, 2000);
                });
            } else {
                // Fallback for older browsers
                var textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                var confirmationMessage = document.getElementById("confirmationMessage");
                confirmationMessage.style.display = "inline";
                setTimeout(function () {
                    confirmationMessage.style.display = "none";
                }, 2000);
            }
        }
        function copyToClipboard(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(function () {
                    var confirmationMessage = document.getElementById("confirmationMessage");
                    confirmationMessage.style.visibility = "visible";  // Show confirmation message
                    confirmationMessage.style.opacity = "1";  // Make the confirmation message visible
                    setTimeout(function () {
                        confirmationMessage.style.visibility = "hidden"; // Hide confirmation message after 1 second
                        confirmationMessage.style.opacity = "0";  // Fade out the message
                    }, 1500);
                });
            } else {
                // Fallback for older browsers
                var textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);

                var confirmationMessage = document.getElementById("confirmationMessage");
                confirmationMessage.style.visibility = "visible";  // Show confirmation message
                confirmationMessage.style.opacity = "1";  // Make the confirmation message visible
                setTimeout(function () {
                    confirmationMessage.style.visibility = "hidden"; // Hide confirmation message after 1 second
                    confirmationMessage.style.opacity = "0";  // Fade out the message
                }, 1000);
            }
        }
    </script>
</body>

</html>`;