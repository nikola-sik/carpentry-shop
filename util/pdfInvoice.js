const path = require('path');
module.exports.generateHeader = (doc) => {

  const invoicePath = path.join('data', 'invoices', 'logo.png');
  doc

    .image(invoicePath, 50, 45, { width: 200 })
    .fillColor("#444444")
    .fontSize(10)
    .text(`${process.env.ADDRESS_PLACE}`, 200, 65, { align: "right" })
    .text(`${process.env.ADDRESS_CITY}`, 200, 80, { align: "right" })
    .moveDown();

}

module.exports.generateFooter = (doc) => {
  doc
    .fontSize(10)
    .text(
      "Hvala Vam na poslovanju.",
      50,
      780,
      { align: "center", width: 500 }
    );
}

module.exports.generateCustomerInformation = (doc, invoice) => {
  const shipping = invoice.shipping;
  doc
    .fillColor("#444444")
    .fontSize(20)
    .text("Faktura", 50, 160);
  generateHr(doc, 185);
  const customerInformationTop = 200;
  doc
    .fontSize(15)
    .text(`Broj fakture: ${invoice.id}`, 50, 200)
    .text(`Datum: ${formatDate(new Date())}`, 50, 220)
    .text(`Mjesto: ${invoice.shipping.city}`, 50, 240)
    .moveDown();
  generateHr(doc, 260);

}

module.exports.generateTableRow = (doc, y, c1, c3, c4, c5) => {
  doc
    .fontSize(10)
    .text(c1, 50, y)

    .text(c3, 280, y, { width: 90, align: "right" })
    .text(c4, 370, y, { width: 90, align: "right" })
    .text(c5, 0, y, { align: "right" });
}



module.exports.generateInvoiceTable = (doc, invoice) => {

  let i,
    invoiceTableTop = 330;

  this.generateTableRow(
    doc,
    invoiceTableTop,
    "Naziv",

    "Cijena po jedinici",
    "Količina",
    "Ukupno (KM)"
  );
  generateHr(doc, invoiceTableTop + 20);

  let p;
  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const position = invoiceTableTop + (i + 1) * 30;
    this.generateTableRow(
      doc,
      position,
      item.title,

      item.price,
      item.quantity,
      (item.price * item.quantity).toFixed(2)
    );
    generateHr(doc, position + 20);
  }

  let subtotalPosition = invoiceTableTop + (i + 1) * 30;

  this.generateTableRow(
    doc,
    subtotalPosition,
    "",

    "Ukupno za plaćanje",
    "",
    invoice.totalPrice
  );
}


function generateHr(doc, y) {
  doc
    .strokeColor("#aaaaaa")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}


function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}

