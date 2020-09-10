this.install = () => {
  Logger.log("Installing Google Forms EMR");
  const properties = PropertiesService.getScriptProperties();

  // reset properties
  properties.deleteAllProperties();
  
  // reset triggers
  ScriptApp.getProjectTriggers().forEach(trigger => 
    ScriptApp.deleteTrigger(trigger)
  );
  
  // create folders
  const emrFolder = DriveApp.createFolder("EMR");  
  const patientFolder = emrFolder.createFolder("EMR Patients");
  properties.setProperty("EMR_PATIENT_FOLDER_ID", patientFolder.getId());

  // attach the new patient form triggers into this form
  const newPatient = FormApp
    .create("New Patient")
    .setTitle("New Patient")
    .setAllowResponseEdits(true);

  DriveApp.getFileById(newPatient.getId()).moveTo(emrFolder);
  properties.setProperty("EMR_NEW_PATIENT_FORM_ID", newPatient.getId());

  // create the New Report form
  const newReport = FormApp
    .create("New EMR Report")
    .setTitle("New EMR Report")
    .setAllowResponseEdits(true);

  DriveApp.getFileById(newReport.getId()).moveTo(emrFolder);
  properties.setProperty("EMR_NEW_REPORT_FORM_ID", newReport.getId());
  
  // the report must specify the 44 character id of the patient file it is going to
  const validation = FormApp.createTextValidation()
    .requireTextLengthGreaterThanOrEqualTo(44)
    .setHelpText('This field should be automatically populated with the 44 character Google Drive ID of the target patient file. If not, re-open this form using the patient popup in the form editor')
    .build();

  newReport
    .addTextItem()
    .setRequired(true)
    .setTitle("Patient File ID")
    .setValidation(validation);
   
  // attach triggers to our new forms
  ScriptApp.newTrigger("onNewPatientOpen").forForm(newPatient).onOpen().create();
  ScriptApp.newTrigger("onNewPatientSubmit").forForm(newPatient).onFormSubmit().create();

  ScriptApp.newTrigger("onNewReportOpen").forForm(newReport).onOpen().create();
  ScriptApp.newTrigger("onNewReportSubmit").forForm(newReport).onFormSubmit().create();
};

this.onNewPatientOpen = event => Logger.log("New patient form opened");

this.onNewPatientSubmit = submission => {
  const patients = getPatients();
  const description = serialize(submission.response);
  const itemResponses = submission.response.getItemResponses();
  
  const firstName = itemResponses.find(itemResponse => 
    itemResponse.getItem().getTitle() == 'First Name'
  ); 

  const lastName = itemResponses.find(itemResponse => 
    itemResponse.getItem().getTitle() == 'Last Name'
  ); 
  
  const name = Utilities.formatString(
    "%s, %s", lastName.getResponse(), firstName.getResponse()
  )
  
  if (name in patients) {
    Logger.log("Updating %s's patient information", name);
  
    FormApp
      .openById(patients[name])
      .setTitle(name)
      .setDescription(description);
  } else {   
    Logger.log("Creating patient file for %s", name);
  
    const form = FormApp
      .create(name)
      .setTitle(name)
      .setAllowResponseEdits(true)
      .setDescription(description);

    form.addParagraphTextItem().setTitle("Report").setRequired(true);
  
    const properties = PropertiesService.getScriptProperties();
    const patientFolderId = properties.getProperty("EMR_PATIENT_FOLDER_ID");
  
    const patientFolder = DriveApp.getFolderById(patientFolderId);
    DriveApp.getFileById(form.getId()).moveTo(patientFolder);
  }
};
  
this.onNewReportOpen = event => {
  const url = "https://kylekyle.github.io/emr/interface/";
  const html = UrlFetchApp.fetch(url).getContentText();

  FormApp.getUi().showSidebar(
    HtmlService.createTemplate(html).evaluate().setTitle("Start Report")
  )
};

this.onNewReportSubmit = submission => {
  const response = submission.response;
  
  const fileId = response.getItemResponses().find(item => {
    Logger.log(item.getItem().getTitle());
    return item.getItem().getTitle() == 'Patient File ID'
  });

  const patientFile = FormApp.openById(fileId.getResponse());
  
  const reportText = Utilities.formatString(
    "%s\n%s", patientFile.getDescription(), serialize(response)
  );

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

this.getReportLink = fileId => {
  const properties = PropertiesService.getScriptProperties();

  const newReportId = properties.getProperty("EMR_NEW_REPORT_FORM_ID");
  const newReport = FormApp.openById(newReportId);

  const fileIdItem = newReport.getItems().find(item =>
    item.getTitle() == 'Patient File ID'
  );
  
  if (!fileIdItem) {
    throw "Could not find 'Patient File ID' field in report form!";
  }
    
  return newReport
    .createResponse()
    .withItemResponse(
      fileIdItem.asTextItem().createResponse(fileId)
    )
    .toPrefilledUrl();
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