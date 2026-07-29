<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>{{ $subject ?? 'Techub' }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f4f5f7;
            color: #1a1a2e;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .wrapper {
            width: 100%;
            table-layout: fixed;
            background-color: #f4f5f7;
            padding: 24px 0;
        }
        .wrapper table { width: 100%; }
        .main {
            max-width: 600px;
            margin: 0 auto;
            padding: 0 16px;
        }
        .card {
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
        }
        .header {
            padding: 32px 32px 0;
            text-align: center;
        }
        .header-logo {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
        }
        .header-logo-icon {
            width: 36px;
            height: 36px;
            background-color: #6C5CE7;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 18px;
            font-weight: 800;
        }
        .header-logo-text {
            font-size: 22px;
            font-weight: 800;
            color: #1a1a2e;
            letter-spacing: -0.5px;
        }
        .header-logo-text span { color: #6C5CE7; }
        .body-content {
            padding: 24px 32px 32px;
        }
        .greeting {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a2e;
            margin-bottom: 12px;
        }
        .paragraph {
            font-size: 15px;
            line-height: 1.6;
            color: #4a4a6a;
            margin-bottom: 16px;
        }
        .feature-list {
            list-style: none;
            padding: 0;
            margin: 20px 0 24px;
        }
        .feature-list li {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 16px;
            margin-bottom: 6px;
            background-color: #f8f9fc;
            border-radius: 10px;
            font-size: 14px;
            color: #1a1a2e;
        }
        .feature-list li::before {
            content: '';
            width: 6px;
            height: 6px;
            background-color: #6C5CE7;
            border-radius: 50%;
            flex-shrink: 0;
        }
        .button {
            display: inline-block;
            padding: 14px 32px;
            background-color: #6C5CE7;
            color: #ffffff !important;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 12px;
            text-align: center;
            margin: 8px 0 16px;
        }
        .button:hover { background-color: #5a4bd1; }
        .button-cell { text-align: center; }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            border-radius: 12px;
            overflow: hidden;
        }
        .info-table td {
            padding: 12px 16px;
            font-size: 14px;
            border-bottom: 1px solid #eeeef4;
        }
        .info-table td:first-child {
            font-weight: 500;
            color: #8e8ea0;
            width: 40%;
        }
        .info-table td:last-child {
            font-weight: 600;
            color: #1a1a2e;
        }
        .info-table tr:last-child td { border-bottom: none; }
        .divider {
            height: 1px;
            background-color: #eeeef4;
            margin: 24px 0;
        }
        .footer {
            padding: 0 32px 32px;
            text-align: center;
        }
        .footer-help {
            font-size: 14px;
            font-weight: 600;
            color: #1a1a2e;
            margin-bottom: 4px;
        }
        .footer-text {
            font-size: 13px;
            line-height: 1.5;
            color: #8e8ea0;
            margin-bottom: 4px;
        }
        .footer-text a {
            color: #6C5CE7;
            text-decoration: none;
        }
        .footer-brand {
            font-size: 12px;
            color: #b0b0c8;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #eeeef4;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .status-badge.success { background-color: #e6f7ee; color: #0a9e5a; }
        .amount-large {
            font-size: 28px;
            font-weight: 800;
            color: #1a1a2e;
            letter-spacing: -1px;
            margin: 8px 0;
        }
        @media only screen and (max-width: 480px) {
            .main { padding: 0 8px; }
            .header { padding: 24px 20px 0; }
            .body-content { padding: 20px; }
            .footer { padding: 0 20px 24px; }
            .info-table td { padding: 10px 12px; font-size: 13px; }
        }
    </style>
</head>
<body>
    <table class="wrapper" role="presentation">
        <tr>
            <td>
                <table class="main" role="presentation">
                    <tr>
                        <td>
                            <div class="card">
                                <div class="header">
                                    <a class="header-logo" href="{{ config('app.url') }}">
                                        <span class="header-logo-icon">T</span>
                                        <span class="header-logo-text">Tech<span>ub</span></span>
                                    </a>
                                </div>
                                <div class="body-content">
                                    {{ $slot ?? '' }}
                                </div>
                                <div class="divider"></div>
                                <div class="footer">
                                    <p class="footer-help">Need help?</p>
                                    <p class="footer-text">
                                        Contact our support team anytime.<br />
                                        Email: <a href="mailto:support@techub.com">support@techub.com</a><br />
                                        Website: <a href="https://techub.com">https://techub.com</a>
                                    </p>
                                    <p class="footer-text" style="margin-top: 8px;">
                                        Thank you for choosing Techub.
                                    </p>
                                    <p class="footer-brand">
                                        &copy; {{ date('Y') }} Techub. All rights reserved.
                                    </p>
                                </div>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
