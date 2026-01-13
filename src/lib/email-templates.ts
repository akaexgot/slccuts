/**
 * Elegant Email Templates for SLC CUTS
 * Styled with a premium barber shop aesthetic: Black, Gold, and White.
 */

const colors = {
    black: '#0a0a0a',
    gold: '#d4af37',
    grey: '#888888',
    white: '#ffffff',
    bg: '#f8f8f8'
};

export const baseTemplate = (content: string, title: string = 'SLC CUTS') => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: ${colors.bg}; color: ${colors.black};">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: ${colors.white}; border: 1px solid #eeeeee;">
        <!-- Header -->
        <tr>
            <td align="center" style="padding: 40px 0; background-color: ${colors.black};">
                <h1 style="margin: 0; color: ${colors.white}; text-transform: uppercase; letter-spacing: 5px; font-weight: 900; font-style: italic;">SLC CUTS</h1>
                <p style="margin: 5px 0 0; color: ${colors.gold}; text-transform: uppercase; font-size: 10px; font-weight: bold; letter-spacing: 3px;">The Premium Grooming Experience</p>
            </td>
        </tr>
        
        <!-- Content -->
        <tr>
            <td style="padding: 40px 30px;">
                ${content}
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="padding: 30px; background-color: #fcfcfc; border-top: 1px solid #eeeeee; text-align: center;">
                <p style="margin: 0; color: ${colors.black}; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">SLC CUTS Barbería</p>
                <p style="margin: 5px 0 15px; color: ${colors.grey}; font-size: 12px;">C. Miguel de Cervantes, 79, 11550 Chipiona, Cádiz</p>
                
                <div style="margin-top: 20px;">
                    <a href="https://instagram.com/slc.cuts" style="text-decoration: none; color: ${colors.gold}; font-weight: bold; font-size: 12px; margin: 0 10px; text-transform: uppercase;">Instagram</a>
                    <a href="https://wa.me/34722108440" style="text-decoration: none; color: ${colors.gold}; font-weight: bold; font-size: 12px; margin: 0 10px; text-transform: uppercase;">WhatsApp</a>
                </div>
                
                <p style="margin-top: 30px; color: #cccccc; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">© ${new Date().getFullYear()} SLC CUTS. Todos los derechos reservados.</p>
            </td>
        </tr>
    </table>
</body>
</html>
`;

export const orderConfirmationTemplate = (order: any) => {
    const itemsHtml = order.order_items
        .map((item: any) => `
            <tr>
                <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-weight: bold;">${item.quantity}x</span> ${item.product_name || item.product?.name}
                </td>
                <td align="right" style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">
                    ${((item.price * item.quantity) / 100).toFixed(2)}€
                </td>
            </tr>
        `).join('');

    const total = ((order.total_amount || order.total_price) / 100).toFixed(2);
    const orderId = order.id.slice(0, 8).toUpperCase();

    const orderContent = `
        <h2 style="margin: 0 0 20px; font-weight: 900; text-transform: uppercase; font-style: italic; letter-spacing: 1px; color: ${colors.black};">¡Gracias por tu compra!</h2>
        <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: ${colors.grey};">
            Hola, hemos recibido correctamente el pago de tu pedido <strong style="color: ${colors.black};">#${orderId}</strong>. Estamos preparando tus productos con el máximo cuidado.
        </p>
        
        <div style="background-color: #fafafa; padding: 20px; border-radius: 5px; border-left: 4px solid ${colors.gold}; margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: ${colors.black};">Resumen del Pedido</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
                <tr>
                    <td style="padding: 20px 0 0; font-weight: bold; font-size: 16px; text-transform: uppercase;">Total</td>
                    <td align="right" style="padding: 20px 0 0; font-weight: 900; font-size: 20px; color: ${colors.black}; italic">${total}€</td>
                </tr>
            </table>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: ${colors.black};">Próximos Pasos</h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${colors.grey};">
                ${order.shipping_method === 'pickup'
            ? 'Tu pedido estará listo para recoger en nuestra tienda pronto. Te avisaremos cuando puedas pasar a por él.'
            : 'Estamos preparando tu envío. Recibirás otro email con el número de seguimiento en cuanto el paquete salga del almacén.'}
            </p>
        </div>
        
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${colors.grey};">
            Si tienes alguna duda, no dudes en contactarnos directamente por WhatsApp o Instagram.
        </p>
    `;

    return baseTemplate(orderContent, `Confirmación de Pedido #${orderId}`);
};

export const manualMessageTemplate = (message: string) => {
    const content = `
        <div style="font-size: 16px; line-height: 1.8; color: ${colors.black};">
            ${message.split('\n').map(line => `<p style="margin: 0 0 15px;">${line}</p>`).join('')}
        </div>
    `;
    return baseTemplate(content, 'SLC CUTS - Mensaje del equipo');
};

export const orderShippedTemplate = (order: any) => {
    const orderId = order.id.slice(0, 8).toUpperCase();
    const itemsHtml = order.order_items
        .map((item: any) => `
            <tr>
                <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-weight: bold;">${item.quantity}x</span> ${item.product_name || item.product?.name}
                </td>
                <td align="right" style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">
                    ${((item.price * item.quantity) / 100).toFixed(2)}€
                </td>
            </tr>
        `).join('');

    const content = `
        <h2 style="margin: 0 0 20px; font-weight: 900; text-transform: uppercase; font-style: italic; letter-spacing: 1px; color: ${colors.black};">¡Tu pedido está en camino!</h2>
        <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: ${colors.grey};">
            Hola, tenemos buenas noticias. Tu pedido <strong style="color: ${colors.black};">#${orderId}</strong> ha sido enviado y pronto llegará a tus manos.
        </p>
        
        <div style="background-color: #fafafa; padding: 20px; border-radius: 5px; border-left: 4px solid ${colors.gold}; margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; color: ${colors.black};">Detalles del Envío</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
            </table>
        </div>
        
        <div style="margin-bottom: 30px; text-align: center;">
            <p style="font-size: 14px; color: ${colors.grey}; margin-bottom: 20px;">
                Si elegiste envío compartido o certificado, estate atento a tu buzón o teléfono.
            </p>
            <a href="https://www.correos.es/es/es/herramientas/localizador/envios" style="display: inline-block; background-color: ${colors.black}; color: ${colors.white}; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; font-size: 12px; border-radius: 4px;">Seguir mi pedido</a>
        </div>
    `;
    return baseTemplate(content, `Tu pedido #${orderId} ha sido enviado - SLC CUTS`);
};

export const adminOrderNotificationTemplate = (order: any) => {
    const orderId = order.id.slice(0, 8).toUpperCase();
    const contact = order.contact_info || {};
    const address = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : (order.shipping_address || {});

    const itemsHtml = order.order_items
        .map((item: any) => `
            <tr>
                <td style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f0f0f0;">
                    <span style="font-weight: bold;">${item.quantity}x</span> ${item.product_name || item.product?.name}
                </td>
                <td align="right" style="padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">
                    ${((item.price * item.quantity) / 100).toFixed(2)}€
                </td>
            </tr>
        `).join('');

    const total = ((order.total_amount || order.total_price) / 100).toFixed(2);

    const content = `
        <h2 style="margin: 0 0 10px; font-weight: 900; text-transform: uppercase; color: ${colors.black};">¡NUEVO PEDIDO PAGADO!</h2>
        <p style="margin: 0 0 20px; font-size: 14px; color: ${colors.grey};">El pedido #${orderId} ha sido recibido y pagado correctamente.</p>
        
        <div style="background-color: #fafafa; padding: 20px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #eeeeee;">
            <h3 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${colors.black};">Información del Cliente</h3>
            <p style="margin: 0; font-size: 14px;"><strong>Nombre:</strong> ${contact.name || 'Invitado'}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Email:</strong> ${contact.email || order.guest_email}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Teléfono:</strong> ${contact.phone || 'No proporcionado'}</p>
            <p style="margin: 10px 0 0; font-size: 14px;"><strong>Método:</strong> ${order.shipping_method === 'pickup' ? 'Recogida en Tienda' : 'Envio a Domicilio'}</p>
        </div>

        ${order.shipping_method !== 'pickup' ? `
        <div style="background-color: #fafafa; padding: 20px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #eeeeee;">
            <h3 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${colors.black};">Dirección de Envío</h3>
            <p style="margin: 0; font-size: 14px;">${address.address || ''}</p>
            <p style="margin: 0; font-size: 14px;">${address.city || ''}, ${address.province || ''}</p>
            <p style="margin: 0; font-size: 14px;">CP: ${address.zip || ''}</p>
        </div>
        ` : ''}
        
        <div style="background-color: #fafafa; padding: 20px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #eeeeee;">
            <h3 style="margin: 0 0 15px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: ${colors.black};">Productos</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
                <tr>
                    <td style="padding: 15px 0 0; font-weight: bold; font-size: 16px;">TOTAL</td>
                    <td align="right" style="padding: 15px 0 0; font-weight: 900; font-size: 18px; color: ${colors.gold};">${total}€</td>
                </tr>
            </table>
        </div>

        <div style="text-align: center; margin-top: 30px;">
            <a href="https://tienda-online-lac.vercel.app/admin/orders" style="display: inline-block; background-color: ${colors.gold}; color: ${colors.black}; padding: 12px 25px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 11px; border-radius: 4px;">Gestionar en el Panel</a>
        </div>
    `;
    return baseTemplate(content, `NUEVO PEDIDO #${orderId} - SLC CUTS`);
};

export const orderShippedText = (order: any) => {
    const orderId = order.id.slice(0, 8).toUpperCase();
    return `
¡Tu pedido está en camino!
Pedido #${orderId}

Hola, tu pedido ha sido enviado y pronto llegará a tus manos.

¡Gracias por confiar en SLC CUTS!
`;
};

export const adminOrderNotificationText = (order: any) => {
    const orderId = order.id.slice(0, 8).toUpperCase();
    const contact = order.contact_info || {};
    return `
NUEVO PEDIDO RECIBIDO #${orderId}
Cliente: ${contact.name || 'Invitado'} (${contact.email || order.guest_email})
Método: ${order.shipping_method}
Total: ${((order.total_amount || order.total_price) / 100).toFixed(2)}€

Gestiona este pedido en el panel de administración.
`;
};

/**
 * Text-only versions for deliverability
 */

export const orderConfirmationText = (order: any) => {
    const orderId = order.id.slice(0, 8).toUpperCase();
    const items = order.order_items
        .map((item: any) => `- ${item.quantity}x ${item.product_name || item.product?.name}: ${((item.price * item.quantity) / 100).toFixed(2)}€`)
        .join('\n');
    const total = ((order.total_amount || order.total_price) / 100).toFixed(2);

    return `
¡Gracias por tu compra en SLC CUTS!
Pedido #${orderId}

Resumen:
${items}

Total: ${total}€

Próximos pasos:
${order.shipping_method === 'pickup'
            ? 'Tu pedido estará listo para recoger en nuestra tienda pronto (C. Miguel de Cervantes, 79, Chipiona).'
            : 'Estamos preparando tu envío. Recibirás el número de seguimiento pronto.'}

Gracias por confiar en el equipo de SLC CUTS.
`;
};

export const manualMessageText = (message: string) => {
    return `
SLC CUTS Barbería
-----------------

${message}

-----------------
C. Miguel de Cervantes, 79, 11550 Chipiona, Cádiz
Instagram: https://instagram.com/slc.cuts
WhatsApp: https://wa.me/34722108440
`;
};
