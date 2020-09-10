this.getReportLink = fileId => {
  const newReportForm = FormApp.getActiveForm();
  
  const fileIdItem = newReportForm.getItems().find(item =>
    item.getTitle() == 'Patient File ID'
  );
  
  if (!fileIdItem) {
    throw "Could not find 'Patient File ID' field in report form!";
  }
    
  return newReportForm
    .createResponse()
    .withItemResponse(
      fileIdItem.asTextItem().createResponse(fileId)
    )
    .toPrefilledUrl();
};
  
this.install = () => {
  Logger.log("Installing Google Forms EMR");
  const properties = PropertiesService.getScriptProperties();

  // reset properties
  properties.deleteAllProperties();
  
  // reset triggers
  ScriptApp.getProjectTriggers().forEach(trigger => 
    ScriptApp.deleteTrigger(trigger)
  );
  
  // attach the new patient form triggers into this form
  const newPatientForm = FormApp.getActiveForm();
  ScriptApp.newTrigger("onNewPatientFormOpen").forForm(newPatientForm).onOpen().create();
  ScriptApp.newTrigger("onNewPatientFormSubmit").forForm(newPatientForm).onFormSubmit().create();  
  
  // at the time this was written, files could have multiple parents ...
  const emrFolder = DriveApp.getFileById(newPatientForm.getId()).getParents().next();  
  const patientFolder = emrFolder.createFolder("EMR Patients");
  properties.setProperty("EMR_PATIENT_FOLDER_ID", patientFolder.getId());

  // create the New Report form
  const newReportForm = FormApp.create("New EMR Report").setTitle("New EMR Report");
  DriveApp.getFileById(newReportForm.getId()).moveTo(emrFolder);
  properties.setProperty("EMR_NEW_REPORT_FORM_ID", newReportForm.getId());
  
  // the report must specify the 44 character id of the patient file it is going to
  const validation = FormApp.createTextValidation()
    .requireTextLengthGreaterThanOrEqualTo(44)
    .setHelpText('This field should be automatically populated with the 44 character Google Drive ID of the target patient file. If not, re-open this form using the patient popup in the form editor')
    .build();

  newReportForm
    .addTextItem()
    .setRequired(true)
    .setTitle("Patient File ID")
    .setValidation(validation);
   
  // attach the report form triggers
  ScriptApp.newTrigger("onNewReportFormOpen").forForm(newReportForm).onOpen().create();
  ScriptApp.newTrigger("onNewReportFormSubmit").forForm(newReportForm).onFormSubmit().create();
};

this.onNewPatientFormOpen = event => Logger.log("EMR: Enrollment form opened");

this.getPatients = () => {
  const patients = {};
  const properties = PropertiesService.getScriptProperties();
  const patientFolder = properties.getProperty("EMR_PATIENT_FOLDER_ID");
  const files = DriveApp.getFolderById(patientFolder).getFilesByType(MimeType.GOOGLE_FORMS);
  
  while (files.hasNext()) {
    const fileId = files.next().getId();
    patients[FormApp.openById(fileId).getTitle()] = fileId;
  }
  
  return patients;
};

this.onNewPatientFormSubmit = submission => {
  const patients = getPatients();
  const description = serialize(submission.response);
  const itemResponses = submission.response.getItemResponses();
  
  const nameItem = itemResponses.find(itemResponse => 
    itemResponse.getItem().getTitle() == 'Name'
  ); 
  
  const name = nameItem.getResponse();
  
  if (name in patients) {
    Logger.log("EMR: Updating %s's enrollment information", name);
  
    FormApp
      .openById(patients[name])
      .setTitle(name)
      .setDescription(description);
  } else {   
    Logger.log("EMR: Creating file for %s", name);
  
    const form = FormApp
      .create(name)
      .setTitle(name)
      .setDescription(description);

    form.addParagraphTextItem().setTitle("Report").setRequired(true);
  
    const properties = PropertiesService.getScriptProperties();
    const patientFolderId = properties.getProperty("EMR_PATIENT_FOLDER_ID");
  
    const patientFolder = DriveApp.getFolderById(patientFolderId);
    DriveApp.getFileById(form.getId()).moveTo(patientFolder);
  }
};
  
this.onNewReportFormOpen = event => {
  FormApp.getUi().showSidebar(
    HtmlService.createTemplateFromFile("Patients").evaluate().setTitle("Start Report")
  )
};

// something weird is going on here. The right trigger is firing, 
// but the submission.source is pointing to the new patient form.
// Not sure why ...
this.onNewReportFormSubmit = submission => {
  const properties = PropertiesService.getScriptProperties();

  const newReportFormId = properties.getProperty("EMR_NEW_REPORT_FORM_ID");
  const newReportForm = FormApp.openById(newReportFormId);
  
  const responses = newReportForm.getResponses();
  const response = responses[responses.length-1];
  const reportText = serialize(response);
  
  const fileId = response.getItemResponses().find(item => {
    Logger.log(item.getItem().getTitle());
    return item.getItem().getTitle() == 'Patient File ID'
  });

  const patientFile = FormApp.openById(fileId.getResponse());
  
  const fileItem = patientFile.getItems().find(item => 
    item.getTitle() == 'Report'
  );
  
  if (!fileItem) {
    throw "Could not find 'Report' field in patient form!";
  }
    
  patientFile
    .createResponse()
    .withItemResponse(
      fileItem.asParagraphTextItem().createResponse(reportText)
    )
    .submit();
};

this.serialize = response => {  
  let summary = "";

  response.getItemResponses().forEach(itemResponse => {
    const item = itemResponse.getItem();

    if (itemResponse.getResponse() && item.getTitle() != 'Patient File ID') {
      summary += Utilities.formatString(
        "%s: %s\n", bold(itemResponse.getItem().getTitle()), itemResponse.getResponse()
      );
    }
  }); 
  
  return summary;
};

this.bold = text => text.replace(/[A-Za-z]/g, char => {
  let diff;
  if (/[A-Z]/.test (char)) {
    diff = "𝐀".codePointAt(0) - "A".codePointAt(0);
  } else {
    diff = "𝐚".codePointAt(0) - "a".codePointAt(0);
  }
  return String.fromCodePoint(char.codePointAt(0) + diff);
});

const proxy = (method, ...params) => this[method](...params);