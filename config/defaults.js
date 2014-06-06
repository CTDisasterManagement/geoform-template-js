define({
    //Default configuration settings for the applciation. This is where you"ll define things like a bing maps key,
    //default web map, default app color theme and more. These values can be overwritten by template configuration settings
    //and url parameters.
    "appid": "",
    "webmap": "52e86d4fafe04e20acfd5a428202e8a1",
    "form_layer": {
        "id": "Citizen_Requests_Form_9964"
    },
    "details": {
        "Title": "Citizen Service Request Form",
        "Logo": "images/GeoForm.png",
        "Description": "Use this form to make a request about Critical Issues, Issues that need to be resolved soon, or General Nuisances. Please specify the severity, what you are seeing, and any personal information you are willing to share. Feel free to add more details with the comment box or attach a photo. Finally - let us know you where when you saw the incident by using your location, typing in an address / coordinates, or simply put a point on the map."
    },
    "fields": [
    {
        "defaultValue": null,
        "domain": null,
        "ieldDataType": "esriFieldTypeSingle",
        "fieldDescription": "Total Mission Hours ?",
        "fieldLabel": "Mission_Hours",
        "fieldName": "Mission_Hours",
        "fieldType": "Single",
        "length": null,
        "nullable": true
    },
    {
        "defaultValue": null,
        "domain": null,
        "ieldDataType": "esriFieldTypeDate",
        "fieldDescription": "Date of Mission ?",
        "fieldLabel": "Mission_Date",
        "fieldName": "Mission_Date",
        "fieldType": "Date",
        "length": 8,
        "nullable": true
    },
    {
        "defaultValue": null,
        "domain": null,
        "ieldDataType": "esriFieldTypeString",
        "fieldDescription": "Team Name ?",
        "fieldLabel": "Team",
        "fieldName": "Team",
        "fieldType": "String",
        "length": 50,
        "nullable": true
    },
    {
        "defaultValue": null,
        "domain": null,
        "ieldDataType": "esriFieldTypeInteger",
        "fieldDescription": "Mission Number ?",
        "fieldLabel": "Mission_Number",
        "fieldName": "Mission_Number",
        "fieldType": "Integer",
        "length": null,
        "nullable": true
    }
    ],
    "theme": {
        "themeName": "Readable",
        "themeSrc": "themes/readable.css"
    },
    "oauthappid": null,
    //Enter the url to the proxy if needed by the applcation. See the "Using the proxy page" help topic for details
    // //developers.arcgis.com/en/javascript/jshelp/ags_proxy.html
    "proxyurl": "",
    //Example of a template specific property. If your template had several color schemes
    //you could define the default here and setup configuration settings to allow users to choose a different
    //color theme.
    //Enter the url to your organizations bing maps key if you want to use bing basemaps
    "bingmapskey": "",
    //Defaults to arcgis.com. Set this value to your portal or organization host name.
    "sharinghost": location.protocol + "//" + "www.arcgis.com",
    //When true the template will query arcgis.com for default settings for helper services, units etc. If you
    //want to use custom settings for units or any of the helper services set queryForOrg to false then enter
    //default values for any items you need using the helper services and units properties.
    "queryForOrg": true,
    // This template is localized. Keep true.
    "localize": true,
    // custom URL parameters for this template
    "urlItems": [
        "extent",
        "edit"
    ],
    "units": null,
    "helperServices": {
        "geometry": {
            "url": null
        },
        "printTask": {
            "url": null
        },
        "elevationSync": {
            "url": null
        },
        "geocode": [{
            "url": null
        }]
    },
    "bitlyLogin": "esri",
    "bitlyKey": "R_65fd9891cd882e2a96b99d4bda1be00e"
});