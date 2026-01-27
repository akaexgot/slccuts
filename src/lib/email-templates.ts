// --- New Template System ---

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
        .order-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .order-table th {
            text-align: left;
            border-bottom: 2px solid #000;
            padding: 10px 0;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .order-table td {
            padding: 15px 0;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }
        .total-row td {
            font-weight: bold;
            border-top: 2px solid #000;
            border-bottom: none;
            font-size: 16px;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div style="background-color: #f4f4f4; padding: 40px 0;">
        <div class="container">
            <div class="header">
                <div class="logo">SLC CUTS</div>
            </div>
            <div class="content">
                <h1 class="h1">${title}</h1>
                <div class="text">
                    ${contentHtml}
                </div>
                ${ctaLink && ctaText ? `
                <div class="button-container">
                    <a href="${ctaLink}" class="button">${ctaText}</a>
                </div>
                ` : ""}
            </div>
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

// --- Specialized Template Helpers ---

export const orderConfirmationTemplate = (order: any) => {
    const itemsHtml = order.order_items?.map((item: any) => `
        <tr>
            <td>${item.product?.name || 'Producto'} x ${item.quantity}</td>
            <td align="right">${(item.price * item.quantity).toFixed(2)}€</td>
        </tr>
    `).join('') || '';

    return `
        <p>¡Hola! Gracias por tu compra en SLC CUTS.</p>
        <p>Tu pedido <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> ha sido recibido y está siendo procesado.</p>
        
        <table class="order-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th align="right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
                <tr class="total-row">
                    <td>TOTAL</td>
                    <td align="right">${order.total_amount?.toFixed(2)}€</td>
                </tr>
            </tbody>
        </table>

        <p>Recibirás otra actualización cuando tu pedido esté en camino.</p>
    `;
};

export const orderConfirmationText = (order: any) => {
    return `¡Gracias por tu compra! Tu pedido #${order.id.slice(0, 8).toUpperCase()} ha sido recibido. Total: ${order.total_amount?.toFixed(2)}€.`;
};

export const orderShippedTemplate = (order: any) => {
    return `
        <p>¡Buenas noticias!</p>
        <p>Tu pedido <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> ya ha salido de nuestro almacén y está en camino.</p>
        <p>Pronto recibirás la información de seguimiento por parte de la empresa de transporte.</p>
        <p>¡Gracias por elegir SLC CUTS!</p>
    `;
};

export const orderShippedText = (order: any) => {
    return `¡Tu pedido #${order.id.slice(0, 8).toUpperCase()} está en camino! SLC CUTS.`;
};

export const adminOrderNotificationTemplate = (order: any) => {
    return `
        <p>Se ha recibido un nuevo pedido pagado.</p>
        <p><strong>Pedido:</strong> #${order.id.slice(0, 8).toUpperCase()}</p>
        <p><strong>Total:</strong> ${order.total_amount?.toFixed(2)}€</p>
        <p><strong>Cliente:</strong> ${order.guest_email || 'Cliente registrado'}</p>
        <p>Revisa el panel de administración para ver todos los detalles y gestionar el envío.</p>
    `;
};

export const adminOrderNotificationText = (order: any) => {
    return `Nuevo pedido pagado: #${order.id.slice(0, 8).toUpperCase()}. Total: ${order.total_amount?.toFixed(2)}€`;
};

export const manualMessageTemplate = (message: string) => {
    return `<div style="white-space: pre-wrap;">${message}</div>`;
};

export const manualMessageText = (message: string) => {
    return message;
};

