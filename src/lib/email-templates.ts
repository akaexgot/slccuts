
interface EmailTemplateProps {
    previewText?: string;
    title: string;
    contentHtml: string;
    ctaLink?: string;
    ctaText?: string;
}

export const getTransactionalEmailHtml = ({
    previewText,
    title,
    contentHtml,
    ctaLink,
    ctaText,
}: EmailTemplateProps) => {
    const currentYear = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>${title}</title>
    <style>
        body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f4f4f4; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #ffffff; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.05); 
        }
        .header { 
            background-color: #000000; 
            padding: 30px 20px; 
            text-align: center; 
        }
        .logo { 
            color: #ffffff; 
            font-size: 24px; 
            font-weight: bold; 
            letter-spacing: 4px; 
            text-decoration: none; 
            font-family: 'Georgia', serif; 
        }
        .content { 
            padding: 40px 30px; 
            background-color: #ffffff; 
        }
        .h1 { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 20px; 
            color: #111; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
        }
        .text { 
            font-size: 16px; 
            color: #555; 
            margin-bottom: 20px; 
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            background-color: #000000;
            color: #ffffff !important;
            padding: 14px 30px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 14px;
        }
        .footer { 
            background-color: #f9f9f9; 
            padding: 30px 20px; 
            text-align: center; 
            font-size: 12px; 
            color: #999; 
            border-top: 1px solid #eeeeee; 
        }
        .footer a { 
            color: #999; 
            text-decoration: underline; 
        }
    </style>
</head>
<body>
    <div style="background-color: #f4f4f4; padding: 40px 0;">
        <div class="container">
            <!-- Header with Logo -->
            <div class="header">
                 <!-- You can replace text with an img tag if you have a hosted logo URL -->
                <div class="logo">SLC CUTS</div>
            </div>

            <!-- Content -->
            <div class="content">
                <h1 class="h1">${title}</h1>
                
                <div class="text">
                    ${contentHtml}
                </div>

                ${ctaLink && ctaText
            ? `
                <div class="button-container">
                    <a href="${ctaLink}" class="button">${ctaText}</a>
                </div>
                `
            : ""
        }
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>&copy; ${currentYear} SLC CUTS. Todos los derechos reservados.</p>
                <p>Chipiona, Cádiz - España</p>
                <p>
                    <a href="https://slccuts.com">Visitar Web</a> | 
                    <a href="mailto:slccuts1998@gmail.com">Contactar</a>
                </p>
            </div>
        </div>
    </div>
</body>
</html>
  `;
};
