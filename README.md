# Google Forms EMR

A bare-bones EMR built on Google Forms and the Google Script API. 

## Installation

First, create a form for enrolling new patients into this system. 

Next, find your new form in Google Drive and move it into it's own folder. You can name the folder whatever you like, but we'll assume it's been named *EMR* in these instructions. 

Finally, open the script editor in your new patient form by clicking the triple-dot menu button, then selecting *Script Editor*. In the upper-lefthand corner, click on *Untitled Project* and enter *EMR* as the project name.

Paste the following into `Code.gs`:

```javascript
/*  
 *  Google Forms EMR
 *  https://github.com/kylekyle/emr/
 * 
 *  Requires: @NotOnlyCurrentDoc, @UrlFetchApp, @DriveApp, @CardService
 */

const url = 'https://kylekyle.github.io/emr/Code.gs';
eval(UrlFetchApp.fetch(url).getContentText());

const proxy = (method, ...params) => this[method](...params);
const install = () => proxy('install');
```

Choose `install` from the *Select function* dropdown in the toolbar and click the play button. You will be asked to authorize the script with the permissions from the manifest. You will get a really scary warning saying the script is unverified and you'll have to click *Proceed to EMR (unsafe)* to continue. Your directory layout in Google Drive will look something like this when it's done:

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