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
    // Using a clear, absolute URL for the logo. If hosted, replace with final URL.
    const logoUrl = "https://fwecgvsfbxzzobjkklul.supabase.co/storage/v1/object/public/products/logo_black.png?t=2024-03-20T00:00:00.000Z";

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
            font-family: 'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            line-height: 1.6; 
            color: #1a1a1a; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa; 
        }
        .container { 
            max-width: 600px; 
            margin: 20px auto; 
            background-color: #ffffff; 
            border-radius: 24px; 
            overflow: hidden; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.08); 
            border: 1px solid #eeeeee;
        }
        .header { 
            background-color: #ffffff; 
            padding: 40px 20px; 
            text-align: center; 
            border-bottom: 1px solid #f0f0f0;
        }
        .logo-img {
            height: 60px;
            width: auto;
            display: block;
            margin: 0 auto;
        }
        .content { 
            padding: 50px 40px; 
            background-color: #ffffff; 
        }
        .h1 { 
            font-size: 28px; 
            font-weight: 900; 
            margin-bottom: 24px; 
            color: #000000; 
            text-transform: uppercase; 
            letter-spacing: -0.5px;
            font-style: italic;
        }
        .text { 
            font-size: 16px; 
            color: #4b5563; 
            margin-bottom: 30px; 
            line-height: 1.8;
        }
        .button-container {
            text-align: center;
            margin: 40px 0 10px;
        }
        .button {
            display: inline-block;
            background-color: #000000;
            color: #ffffff !important;
            padding: 18px 40px;
            text-decoration: none;
            border-radius: 14px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 12px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        }
        .divider {
            height: 1px;
            background-color: #f0f0f0;
            margin: 40px 0;
        }
        .footer { 
            background-color: #000000; 
            padding: 60px 40px; 
            text-align: left; 
            font-size: 13px; 
            color: #9ca3af; 
        }
        .footer-logo {
            color: #ffffff;
            font-size: 20px;
            font-weight: 900;
            margin-bottom: 25px;
            display: block;
            text-decoration: none;
            letter-spacing: 2px;
        }
        .footer-info {
            margin-bottom: 30px;
        }
        .info-row {
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }
        .info-label {
            color: #ffffff;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 1px;
            margin-right: 10px;
        }
        .footer a { 
            color: #ffffff; 
            text-decoration: none; 
            font-weight: bold;
        }
        .social-links {
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid #374151;
        }
        .order-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background-color: #f9fafb;
            border-radius: 16px;
            overflow: hidden;
        }
        .order-table th {
            text-align: left;
            background-color: #f3f4f6;
            padding: 15px 20px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #6b7280;
        }
        .order-table td {
            padding: 20px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 14px;
            color: #1a1a1a;
        }
        .total-row td {
            font-weight: 900;
            font-size: 18px;
            color: #000000;
            background-color: #ffffff;
            border-top: 2px solid #000;
        }
    </style>
</head>
<body>
    <div style="background-color: #f8f9fa; padding: 20px 0;">
        <div class="container">
            <div class="header">
                <!-- If logo constant is configured in Resend, use it here. 
                     Otherwise, a high-res text fallback or remote image -->
                <h1 style="font-size: 28px; font-weight: 900; color: #000; margin:0; letter-spacing: 4px; text-transform:lowercase; font-style:italic;">@slc.cuts</h1>
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
                <a href="https://slccuts.com" class="footer-logo">@slc.cuts</a>
                
                <div class="footer-info">
                    <div class="info-row">
                        <span class="info-label">Ubicación:</span>
                        <span>C. Miguel de Cervantes, 79, 11550 Chipiona, Cádiz</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Teléfono:</span>
                        <a href="tel:+34722108440">+34 722 10 84 40</a>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <a href="mailto:slccuts1998@gmail.com">slccuts1998@gmail.com</a>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Horario:</span>
                        <span>L-V: 10:00 - 20:00 | S: 10:00 - 14:00</span>
                    </div>
                </div>

                <div class="social-links">
                    <p style="margin-bottom: 15px;">Síguenos para más estilo:</p>
                    <a href="https://instagram.com/slc.cuts" style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; border: 1px solid #ffffff; padding: 10px 20px; border-radius: 8px;">Instagram</a>
                </div>

                <p style="margin-top: 50px; opacity: 0.5; font-size: 11px;">
                    &copy; ${currentYear} SLC CUTS - Barbería de Autor & Shop.<br>
                    Estás recibiendo este correo como parte de tu actividad en nuestra tienda online.
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
            <td style="font-weight: bold;">
                ${item.product?.name || 'Producto'}
                ${item.size ? `<br><span style="font-size: 11px; color: #6b7280; font-weight: normal;">Talla: ${item.size}</span>` : ''}
            </td>
            <td align="center" style="color: #6b7280;">x${item.quantity}</td>
            <td align="right" style="font-weight: bold;">${(item.price * item.quantity / 100).toFixed(2)}€</td>
        </tr>
    `).join('') || '';

    return `
        <p>¡Hola! Hemos recibido tu pedido y ya nos hemos puesto manos a la obra para prepararlo con la maestría que nos caracteriza.</p>
        <p>Aquí tienes los detalles de tu compra <strong>#${order.id.slice(0, 8).toUpperCase()}</strong>:</p>
        
        <table class="order-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th align="center">Cant.</th>
                    <th align="right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
                <tr class="total-row">
                    <td colspan="2" align="right" style="padding-right: 20px;">TOTAL</td>
                    <td align="right">${(order.total_amount / 100).toFixed(2)}€</td>
                </tr>
            </tbody>
        </table>

        <div style="background-color: #f3f4f6; padding: 25px; border-radius: 12px; margin-top: 30px;">
            <p style="margin: 0; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Siguiente paso:</p>
            <p style="margin: 10px 0 0; color: #4b5563; font-size: 14px;">Te avisaremos en cuanto tu pedido salga de nuestra barbería hacia tu casa.</p>
        </div>
    `;
};

export const orderConfirmationText = (order: any) => {
    return `¡Gracias por tu compra! Tu pedido #${order.id.slice(0, 8).toUpperCase()} ha sido recibido. Total: ${order.total_amount?.toFixed(2)}€.`;
};

export const orderShippedTemplate = (order: any) => {
    return `
        <div style="text-align: center; padding: 20px 0;">
            <div style="font-size: 50px; margin-bottom: 20px;">🚚</div>
            <p style="font-size: 18px; font-weight: bold; color: #000;">¡Tu estilo ya va de camino!</p>
            <p>Tu pedido <strong>#${order.id.slice(0, 8).toUpperCase()}</strong> ha salido de nuestra barbería y está en manos del transportista.</p>
            <p>En las próximas horas recibirás un email con el enlace de seguimiento para que puedas controlar la entrega.</p>
            <p>¡Prepárate para disfrutar de tus productos premium!</p>
        </div>
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

// --- New Specialized Templates (Feedback, Low Stock, Abandoned Cart) ---

/**
 * Solicitud de Feedback (Post-venta)
 */
export const feedbackRequestTemplate = (firstName: string) => {
    return `
        <p>¡Hola ${firstName}!</p>
        <p>Hace unos días que recibiste tu pedido de <strong>SLC CUTS</strong> y nos encantaría saber qué te ha parecido.</p>
        <p>Tu opinión nos ayuda a seguir mejorando y a que otros clientes confíen en nuestra maestría y productos premium.</p>
        <p>Además, si nos etiquetas en Instagram con una foto de tu pedido o tu nuevo estilo, ¡nos harás muy felices!</p>
    `;
};

export const feedbackRequestText = (firstName: string) => {
    return `Hola ${firstName}, ¿qué te han parecido tus productos de SLC CUTS? Nos encantaría conocer tu opinión.`;
};

/**
 * Notificación de Stock Bajo (Para el Administrador)
 */
export const lowStockAdminTemplate = (product: any) => {
    return `
        <p>Atención Administrador,</p>
        <p>El siguiente producto tiene existencias críticas:</p>
        <div style="background: #fdf2f2; border: 1px solid #f87171; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #991b1b;">${product.name}</p>
            <p style="margin: 5px 0 0; color: #b91c1c;">Quedan solo <strong>${product.stock}</strong> unidades disponibles.</p>
        </div>
        <p>Te recomendamos reponer el stock lo antes posible para no perder ventas.</p>
    `;
};

export const lowStockAdminText = (product: any) => {
    return `ALERTA DE STOCK: ${product.name} tiene solo ${product.stock} unidades.`;
};

/**
 * Recuperación de Carrito Abandonado
 */
export const abandonedCartTemplate = (firstName: string, cartItems: any[]) => {
    const itemsList = cartItems.map(item => `
        <div style="padding: 15px 0; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: #111;">${item.name}</span>
            <span style="color: #6b7280; font-size: 13px;">x${item.quantity}</span>
        </div>
    `).join('');

    return `
        <p>¡Hola ${firstName}!</p>
        <p>Hemos notado que dejaste algunos tesoros en tu carrito y no queremos que te quedes sin ellos.</p>
        <p>En <strong>SLC CUTS</strong> los productos vuelan, por lo que te hemos guardado el carrito un poco más por si quieres terminar tu compra ahora.</p>
        
        <div style="background: #ffffff; border: 1px solid #eeeeee; padding: 25px; border-radius: 20px; margin: 30px 0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            <p style="margin: 0 0 15px; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #6b7280;">Te espera en tu carrito:</p>
            ${itemsList}
        </div>
        
        <p>Pulsa el botón de abajo para recuperar tu selección y finalizar el pedido en un clic.</p>
    `;
};

export const abandonedCartText = (firstName: string) => {
    return `¡Hola ${firstName}! Te has dejado algo en tu carrito de SLC CUTS. ¡Vuelve antes de que se agote!`;
};

/**
 * Auto-respuesta de Contacto (Confirmación de recepción)
 */
export const contactAutoResponderTemplate = (name: string) => {
    return `
        <p>¡Hola ${name}!</p>
        <p>Hemos recibido tu mensaje correctamente a través de nuestro formulario de contacto.</p>
        <p>Nuestro equipo revisará tu consulta lo antes posible. Normalmente respondemos en un plazo de **24 a 48 horas laborables**.</p>
        <p>Si tu consulta es urgente, recuerda que también puedes contactarnos directamente por WhatsApp o teléfono.</p>
        <p>Gracias por contactar con <strong>SLC CUTS</strong>.</p>
    `;
};

export const contactAutoResponderText = (name: string) => {
    return `Hola ${name}, hemos recibido tu mensaje en SLC CUTS. Te responderemos en 24-48h laborables. ¡Gracias!`;
};

