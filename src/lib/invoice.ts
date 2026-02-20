import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const generateInvoicePDF = async (order: any) => {
    if (!order) throw new Error("Order data is required to generate invoice");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Styles ---
    const primaryColor = [0, 0, 0]; // Black
    const secondaryColor = [100, 100, 100]; // Gray

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("SLC CUTS", 20, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("Barbería & Productos Premium", 20, 36);

    // Invoice Info (Top Right)
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("FACTURA", pageWidth - 20, 30, { align: "right" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nº ${order.id.slice(0, 8).toUpperCase()}`, pageWidth - 20, 36, { align: "right" });
    const date = order.created_at ? new Date(order.created_at) : new Date();
    doc.text(`Fecha: ${date.toLocaleDateString('es-ES')}`, pageWidth - 20, 42, { align: "right" });

    doc.setDrawColor(230, 230, 230);
    doc.line(20, 50, pageWidth - 20, 50);

    // --- Parties ---
    // Emisor
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("EMISOR:", 20, 65);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("SLC CUTS Barbería", 20, 71);
    doc.setFont("helvetica", "normal");
    doc.text("Santiago", 20, 76);
    doc.text("NIF: 722108440", 20, 81);
    doc.text("C. Miguel de Cervantes, 79", 20, 86);
    doc.text("11550 Chipiona, Cádiz", 20, 91);

    // Cliente
    const contact = order.contact_info || {};
    const customerName = contact.name || order.customer_email || order.guest_email || "Cliente General";

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("CLIENTE:", 110, 65);
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(customerName, 110, 71);
    doc.setFont("helvetica", "normal");
    if (order.customer_email || order.guest_email) {
        doc.text(order.customer_email || order.guest_email || "", 110, 76);
    }
    if (contact.phone) {
        doc.text(`Tel: ${contact.phone}`, 110, 81);
    }

    // Address if available
    if (order.shipping_address) {
        let addr = order.shipping_address;
        if (typeof addr === 'string') {
            try { addr = JSON.parse(addr); } catch (e) { }
        }
        if (addr.address) {
            doc.text(addr.address, 110, 86);
            doc.text(`${addr.zip || addr.zipCode || ''} ${addr.city || ''}`, 110, 91);
        }
    }

    // --- Items Table ---
    const tableData = order.order_items.map((item: any) => [
        item.product?.name || item.product_name || "Producto",
        item.quantity,
        `${(item.price / 100).toFixed(2)}€`,
        `${(item.price * item.quantity / 100).toFixed(2)}€`
    ]);

    autoTable(doc, {
        startY: 105,
        head: [['Concepto', 'Cant.', 'Precio Unit.', 'Total']],
        body: tableData,
        headStyles: {
            fillColor: [0, 0, 0],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left'
        },
        columnStyles: {
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' }
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250]
        },
        margin: { left: 20, right: 20 },
        styles: {
            fontSize: 9,
            cellPadding: 4
        }
    });

    // --- Summary ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalAmount = (order.total_amount || order.total_price || 0);
    const totalEuro = totalAmount / 100;

    // Tax Calculation (21% included in price as per existing invoice)
    const baseImponible = totalEuro / 1.21;
    const iva = totalEuro - baseImponible;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

    doc.text("Base Imponible:", pageWidth - 80, finalY);
    doc.text(`${baseImponible.toFixed(2)}€`, pageWidth - 20, finalY, { align: "right" });

    doc.text("IVA (21%):", pageWidth - 80, finalY + 6);
    doc.text(`${iva.toFixed(2)}€`, pageWidth - 20, finalY + 6, { align: "right" });

    if (order.shipping_cost > 0) {
        doc.text("Envío:", pageWidth - 80, finalY + 12);
        doc.text(`${(order.shipping_cost / 100).toFixed(2)}€`, pageWidth - 20, finalY + 12, { align: "right" });
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    const summaryOffset = order.shipping_cost > 0 ? 22 : 16;
    doc.text("TOTAL:", pageWidth - 80, finalY + summaryOffset);
    doc.text(`${totalEuro.toFixed(2)}€`, pageWidth - 20, finalY + summaryOffset, { align: "right" });

    // --- Footer ---
    doc.setDrawColor(240, 240, 240);
    doc.line(20, 265, pageWidth - 20, 265);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    const footerText = "Gracias por tu confianza. SLC CUTS Barbería & Shop.";
    const contactText = "slccuts1998@gmail.com | Chipiona, Cádiz";
    doc.text(footerText, pageWidth / 2, 275, { align: "center" });
    doc.text(contactText, pageWidth / 2, 280, { align: "center" });

    return doc.output('arraybuffer');
};
