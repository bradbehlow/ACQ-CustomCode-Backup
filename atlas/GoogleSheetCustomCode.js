function deleteOldFilesFromFolder(folderId, monthsAgo = 3) {
  const folder = DriveApp.getFolderById(folderId);
  const thresholdDate = new Date();
  thresholdDate.setMonth(thresholdDate.getMonth() - monthsAgo);

  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const createdDate = file.getDateCreated();

    if (createdDate < thresholdDate) {
      try {
        file.setTrashed(true); // Use file.delete() if you want permanent deletion
        Logger.log(`Trashed file: ${file.getName()} created on ${createdDate}`);
      } catch (err) {
        Logger.log(`Failed to delete file: ${file.getName()} – ${err.message}`);
      }
    }
  }
}

function generatePdfFromTemplate(data) {
  const templateId = '1RfF9gi4Q4xgj4In-JaxppfeKv8lLbTAwvBWsoRLGc5Q'; // Your template ID
  const folderId = '1j389L2zq4JUNa_oP7BivvwjpVM-gYyXQ'; // Destination folder ID
  deleteOldFilesFromFolder(folderId);
  const copyTitle = `Generated Document - ${data.name || "Untitled"}`;

  // Step 1: Copy template
  const templateFile = DriveApp.getFileById(templateId);
  const copy = templateFile.makeCopy(copyTitle);
  const copyDoc = DocumentApp.openById(copy.getId());
  const body = copyDoc.getBody();

  // Step 2: Replace placeholders
  body.replaceText('{{name}}', data.name || '');
  body.replaceText('{{address}}', data.address || '');
  body.replaceText('{{state}}', data.state || '');
  body.replaceText('{{County}}', data.county || '');
  body.replaceText('{{LoanAmount}}', data.loanAmount?.toString() || '');
  body.replaceText('{{Insurance}}', data.insurance?.toString() || '');
  body.replaceText('{{escrow}}', data.escrow?.toString() || '');
  body.replaceText('{{recording}}', data.recording?.toString() || '');
  body.replaceText('{{affordable}}', data.affordable?.toString() || '');
  body.replaceText('{{Total}}', data.total?.toString() || '');
  body.replaceText('{{TransactionType}}', data.transactionType?.toString() || '');
  body.replaceText('{{Services}}', data.serviceType?.toString() || '');

  copyDoc.saveAndClose();

  // Step 3: Convert to PDF
  const pdfBlob = DriveApp.getFileById(copy.getId()).getAs('application/pdf');

  // Step 4: Move PDF to target folder
  const folder = DriveApp.getFolderById(folderId);
  const pdfFile = folder.createFile(pdfBlob).setName(copyTitle + '.pdf');

  // Optional: Remove the copied temp Google Doc
  DriveApp.getFileById(copy.getId()).setTrashed(true);

  // Step 5: Return URL
  return pdfFile.getUrl();
}

function doGet(e) {
  const data = {
    name: e.parameter.name,
    address: e.parameter.address,
    state: e.parameter.state,
    county: e.parameter.county,
    loanAmount: parseFloat(e.parameter.loanAmount),
    insurance: parseFloat(e.parameter.insurance),
    escrow: parseFloat(e.parameter.escrow),
    recording: parseFloat(e.parameter.recording),
    affordable: parseFloat(e.parameter.affordable),
    total: parseFloat(e.parameter.total),
    transactionType: e.parameter.transactionType,
    serviceType: e.parameter.serviceType
  };

  try {
    const url = generatePdfFromTemplate(data);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, url }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function testGeneratePdf() {
  const resultUrl = generatePdfFromTemplate({
    name: 'John Doe',
    address: "asdasdsad",
    state: 'FL',
    county: 'Volusia',
    loanAmount: 500000,
    insurance: 3000,
    escrow: 800,
    recording: 150,
    affordable: 50,
    total: 4000,
    transactionType: "Refinance",
    serviceType: "Title Only"
  });

  Logger.log('PDF URL: ' + resultUrl);
}

