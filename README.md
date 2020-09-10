# Google Forms EMR

A bare-bones EMR built on Google Forms and the Google Script API. 

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

In the *Select function* dropdown in the toolbar, select `install`, and click the play button. You will be asked to authorize the script with the permissions from the manifest. You will get a really scary warning saying the script is unverified and you'll have to click *Proceed to EMR (unsafe)* to continue. 

If the installation is successful, your directory layout in Google Drive will look something like this when it's done:

```text
EMR
├── New EMR Report Form
├── New EMR Patient Form 
└── EMR Patients
    └── Patient files will be created here
```

## Creating patient files

When you submit the *New Patient Form*, it will create the patient file form automatically. It's important that patient files are created through enrollment and not copied from another patient file. Never edit the question in a patient file form.

## Adding a report to a patient file

The *New Report Form* is filled out when seeing a patient. Reports don't need to collect biographical patient information, like name and address, because each report is added to the patient's file which has that information already. 

There is a pop-up that will appear when you open the *New Report Form*. 

## Delete a patient

Reset patient cache?

## How does this work?

Most of the functionality in this project comes baked into Google Forms because it is an awesome project. There are really three tricks to this project:

## Notes

This would have been a lot simpler with a Card interface, but as of the time this was written, they didn't support mobile outside of Gmail:

https://developers.google.com/gsuite/add-ons/concepts/card-interfaces

The configuration is stored in the project properties which you can get to in the Script Editor under File -> Project Properties. 

There are some limits: https://developers.google.com/apps-script/guides/services/quotas