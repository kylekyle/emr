# Google Forms EMR

This is a bare-bones electronic medical record (EMR) system built on top of [Google Forms](https://forms.google.com) with some glue from the [Google Script](https://script.google.com) API. 

![](https://i.imgur.com/DOva9cp.png)

## Installation

Start by creating a [new Google Script project](https://script.google.com). We'll name it *EMR*. Open your project and select `Code.gs` in the file tree. Replace its contents with the following:

```javascript
/*  
 *  Google Forms EMR
 *  https://github.com/kylekyle/emr/
 */

let url = 'https://kylekyle.github.io/emr/Code.gs';
url += '?v=' + Utilities.getUuid();
eval(UrlFetchApp.fetch(url).getContentText());

const proxy = (method, ...params) => this[method](...params);
const install = () => proxy('install');
```

Next, click *View* -> *Show manifest file*, then select *appsscript.json* in the file tree and replace its contents with the following:

```json
{
  "timeZone": "America/New_York",
  "dependencies": {
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/forms",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/script.container.ui"
  ]
}
```

In the *Select function* dropdown in the toolbar select `install` then click the play button. You will be asked to authorize the script with the permissions from the manifest. You will get a really scary warning saying the script is unverified and you'll have to click *Proceed to EMR (unsafe)* to continue. 

If the installation is successful, your directory layout in Google Drive will look something like this:

```text
EMR/
├── New EMR Report
├── New Patient 
└── EMR Patients/
    ├── Patient A
    ├── Patient B
    └── ...
```

## Adding patients

Every patient has a file, which is just another Google Form. This file is created by filling out the *New Patient Form*. The information you collect in the new patient form will be saved into that patient's file. Any reports you submit for the patient will also be saved as responses to their file. 

## Submitting reports

The *New Report Form* is filled out when seeing a patient. Reports don't need to collect biographical patient information, like name and address, because each report is added to the patient's file which has that information already. 

When you open the *New Report Form* for editing, a popup will appear with a list of patients that you can file the report against. The popup is the last thing to load, so it can take a while to appear.  

## Things you can and cannot edit

You should not copy or delete the *New Patient* form, the *New Report* form, or the *Patients* folder. The IDs of these files are hard-coded into the project properties and copies would have different IDs. 

**Patient Files**

* You **can** edit the title and description of a patient's file. Whatever you put in the title is what will appear in the patient popup's dropdown. The description has biographical information like address, blood type, etc. 
* You **should not** edit the questions in the patient files. The *New Report* form assumes there is only one question, called *Report* and it saves everything there. 

**New Patient Form**

* You **should not** edit or delete the *First Name* or *Last Name* questions. Those are used to create patient files. 
* You **can** add/remove/edit any other question in the form. The responses to these questions are saved into the description of the patient's file.

**New Report Form**

* You **should not** edit or delete the *Patient File ID* question. This is field is automatically populated by the popup and is used to copy the report to the appropriate patient file. 
* You **can** add/remove/edit any other question in the form. The responses to these questions are saved into the patient's file.  

## Deleting a patient

To delete a patient, just remove their patient file from  the *Patients* folder. I recommend creating an *Archive* folder to put them in.  

## Getting updates

The code installed into `Code.gs` just evaluates code from this repository. You should never have to update your code - you will always be running whatever code you see in this project. 

## How can I tell if it broke?

Log into your [Google Script dashboard](https://script.google.com) and click on *My Executions*. If you see any errors, there is a problem. Feel free to [submit an issue](https://github.com/kylekyle/emr/issues/new).

## Why don't you use Google's `Card` interface?

This would have been a lot simpler with a Card interface but, at the time this was written, you [couldn't access a Google Forms `Card` interface from a mobile device](https://developers.google.com/gsuite/add-ons/concepts/card-interfaces).

## Is there a limit to the number patients I can have?

Not really. There is a limit the on number of hours that Google Scripts are allowed to execute, but the [allocations are pretty generous](https://developers.google.com/apps-script/guides/services/quotas). 