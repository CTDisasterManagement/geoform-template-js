define([
   "dojo/_base/declare",
    "dojo/on",
    "dojo/dom",
    "esri/request",
    "dojo/_base/array",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/query",
    "dojo/dom-class",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/DeferredList",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!application/dijit/templates/author.html",
    "application/browseIdDlg",
    "esri/IdentityManager",
    "dojo/i18n!application/nls/builder",
    "esri/arcgis/utils",
    "dojo/domReady!"
], function (declare, on, dom, esriRequest, array, domConstruct, domAttr, query, domClass, lang, Deferred, DeferredList, _WidgetBase, _TemplatedMixin, authorTemplate, BrowseIdDlg, IdentityManager, i18n, arcgisUtils) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: authorTemplate,
        currentState: "webmap",
        previousState: null,
        currentConfig: null,
        previousConfig: null,
        response: null,
        userInfo: null,
        browseDlg: null,
        fieldInfo: {},
        nls: i18n,
        themes: [
            { "name": "Cyborg", url: "themes/cyborg.css", "thumbnail": "images/cyborgThumbnail.jpg", "refUrl": "http://bootswatch.com/cyborg/" },
            { "name": "Cerulean", url: "themes/cerulean.css", "thumbnail": "images/cerulianThumbnail.jpg", "refUrl": "http://bootswatch.com/cerulean/" },
            { "name": "Journal", url: "themes/journal.css", "thumbnail": "images/journalThumbnail.jpg", "refUrl": "http://bootswatch.com/journal/" },
            { "name": "Darkly", url: "themes/darkly.css", "thumbnail": "images/darklyThumbnail.jpg", "refUrl": "http://bootswatch.com/darkly/" },
            { "name": "Readable", url: "themes/readable.css", "thumbnail": "images/readableThumbnail.jpg", "refUrl": "http://bootswatch.com/readable/" }
        ],

        constructor: function () {
        },

        startup: function (config, userInfo, response) {

            dom.byId("parentContainter").appendChild(this.authorMode);
            var $tabs = $('.tab-links li');
            domClass.add($('.navigationTabs')[0], "activeTab");

            $('.prevtab').on('click', lang.hitch(this, function () {
                $tabs.filter('.active').prev('li').find('a[data-toggle="tab"]').tab('show');
            }));

            $('.nexttab').on('click', lang.hitch(this, function () {
                $tabs.filter('.active').next('li').find('a[data-toggle="tab"]').tab('show');
            }));

            $('.navigationTabs').on('click', lang.hitch(this, function (evt) {
                this._getPrevTabDetails(evt);
            }));

            $('#save').on('click', lang.hitch(this, function () {
                this._updateItem();
            }));

            this.previousConfig = lang.clone(this.config);
            this.currentConfig = config;
            this.userInfo = userInfo;
            this.response = response;
            this._addOperationalLayers();
            this._populateDetails();
            this._populateThemes();
            this._initWebmapSelection();
            this._loadCSS("css/browseDialog.css");
            on(dom.byId("selectLayer"), "change", lang.hitch(this, function (evt) {
                this.currentConfig.layer = evt.currentTarget.value;
                this._populateFields(evt.currentTarget.value);
                if (evt.currentTarget.value == "Select Layer") {
                    array.forEach(query(".navigationTabs"), lang.hitch(this, function (currentTab) {
                        if (domAttr.get(currentTab, "tab") == "fields" || domAttr.get(currentTab, "tab") == "preview" || domAttr.get(currentTab, "tab") == "publish") {
                            this._disableTab(currentTab);
                        }
                    }));
                }
                else {
                    array.forEach(query(".navigationTabs"), lang.hitch(this, function (currentTab) {
                        if (domAttr.get(currentTab, "tab") == "fields" || ((domAttr.get(currentTab, "tab") === "preview" || domAttr.get(currentTab, "tab") === "publish") && query(".fieldCheckbox:checked").length !== 0)) {
                            this._enableTab(currentTab);
                        }
                    }));
                }
            }));
        },

        //function to get the details of previously selected tab 
        _getPrevTabDetails: function (evt) {
            if (evt) {
                this.previousState = this.currentState;
                this.currentState = evt.currentTarget.getAttribute("tab");
                this._updateAppConfiguration(this.previousState);
            }
        },

        //function will validate and add operational layers in dropdown
        _addOperationalLayers: function () {
            var layerDefeeredListArr = [], layerDefeeredList, attribute;
            this._clearLayerOptions();
            array.forEach(this.currentConfig.itemInfo.itemData.operationalLayers, lang.hitch(this, function (currentLayer) {
                if (currentLayer.url && currentLayer.url.split("/")[currentLayer.url.split("/").length - 2].toLowerCase() == "featureserver") {
                    layerDefeeredListArr.push(this._queryLayer(currentLayer.url));
                }
            }));
            layerDefeeredList = new DeferredList(layerDefeeredListArr);
            layerDefeeredList.then(lang.hitch(this, function () {
                if (dom.byId("selectLayer").options.length <= 1) {
                    alert(i18n.builder.invalidWebmapSelectionAlert);
                    array.forEach(query(".navigationTabs"), lang.hitch(this, function (currentTab) {
                        attribute = currentTab.getAttribute("tab");
                        if (attribute != "webmap") {
                            this._disableTab(currentTab);
                        }
                    }));
                }
                else {
                    array.forEach(query(".navigationTabs"), lang.hitch(this, function (currentTab) {
                        attribute = currentTab.getAttribute("tab");
                        if (((attribute == "publish" || attribute == "preview") && (query(".fieldCheckbox:checked").length == 0)) || (attribute == "fields" && dom.byId("selectLayer").value === "Select Layer")) {
                            this._disableTab(currentTab);
                        }
                        else {
                            this._enableTab(currentTab);
                        }
                    }));
                }
            }));
        },

        //function to set the title, logo-path and description from config 
        _populateDetails: function () {
            dom.byId("detailTitleInput").value = this.currentConfig.details.Title;
            dom.byId("detailLogoInput").value = this.currentConfig.details.Logo;
            dom.byId("detailDescriptionInput").value = this.currentConfig.details.Description;
        },

        //function to populate all available themes in application
        _populateThemes: function () {
            var themesHeader, themesRadioButton, themesDivContainer, themesDivContent, themesLabel, themeThumbnail;
            themesHeader = domConstruct.create("h2", { innerHTML: i18n.builder.selectThemeText }, this.stylesList);
            array.forEach(this.themes, lang.hitch(this, function (currentTheme) {
                themesDivContainer = domConstruct.create("div", { class: "col-md-4" }, this.stylesList);
                themesDivContent = domConstruct.create("div", { class: "radio" }, themesDivContainer);
                themesLabel = domConstruct.create("label", { innerHTML: currentTheme.name }, themesDivContent);
                themesRadioButton = domConstruct.create("input", { type: "radio", name: "themesRadio", themeName: currentTheme.name, themeUrl: currentTheme.url }, themesLabel);
                if (currentTheme.name == this.currentConfig.theme.themeName) {
                    themesRadioButton.checked = true;
                    //this._loadCSS(currentTheme.url);
                }
                on(themesRadioButton, "change", lang.hitch(this, function (evt) {
                    this._configureTheme(evt);
                }));
                domConstruct.create("br", {}, themesLabel);
                themeThumbnail = domConstruct.create("img", { src: currentTheme.thumbnail, width: "200px", height: "133px", "style": "border:1px solid #555; " }, themesLabel);
                on(themeThumbnail, "click", function () { window.open(currentTheme.refUrl) });
            }));
        },

        //function to select the previously configured theme.
        _configureTheme: function (selectedTheme) {
            this.currentConfig.theme.themeName = selectedTheme.currentTarget.getAttribute("themeName");
            this.currentConfig.theme.themeSrc = selectedTheme.currentTarget.getAttribute("themeUrl");
        },

        //function will populate all editable fields with validations
        _populateFields: function (layerName) {
            var configuredFields = [], configuredFieldName = [], fieldRow, fieldNumber, fieldName, fieldLabel, fieldLabelInput,
            fieldDescription, fieldDescriptionInput, fieldCheckBox,
             fieldType, fieldTypeSelect, fieldCheckBoxInput, currentIndex = 0, layerIndex;
            if (this.geoFormFieldsTable) {
                domConstruct.empty(this.geoFormFieldsTable);
            }
            array.forEach(this.currentConfig.fields, lang.hitch(this, function (currentField) {
                configuredFieldName.push(currentField.fieldName);
                configuredFields.push(currentField);
            }));

            array.forEach(this.currentConfig.itemInfo.itemData.operationalLayers, lang.hitch(this, function (currentLayer, index) {
                if (this.fieldInfo[layerName]) {
                    if (this.fieldInfo[layerName].layerUrl == currentLayer.url) {
                        layerIndex = index;
                    }
                }
            }));
            if (this.fieldInfo[layerName]) {
                array.forEach(this.fieldInfo[layerName].Fields, lang.hitch(this, function (currentField, fieldIndex) {
                    if (currentField.editable) {

                        fieldRow = domConstruct.create("tr", {}, this.geoFormFieldsTable);
                        fieldNumber = domConstruct.create("td", { innerHTML: currentIndex + 1 }, fieldRow);
                        fieldCheckBox = domConstruct.create("td", {}, fieldRow);

                        fieldCheckBoxInput = domConstruct.create("input", { "class": "fieldCheckbox", type: "checkbox", index: currentIndex, fieldIndex: fieldIndex }, fieldCheckBox);
                        on(fieldCheckBoxInput, "change", lang.hitch(this, function () {
                            this._getFieldCheckboxState();
                        }));
                        fieldName = domConstruct.create("td", { class: "fieldName", innerHTML: currentField.name, style: "color:#555; vertical-align:center !important;" }, fieldRow);
                        fieldLabel = domConstruct.create("td", {}, fieldRow);

                        fieldLabelInput = domConstruct.create("input", { class: "form-control fieldLabel", placeholder: i18n.builder.fieldLabelPlaceHolder, value: currentField.alias }, fieldLabel);

                        fieldType = domConstruct.create("td", {}, fieldRow);
                        fieldTypeSelect = domConstruct.create("select", { disabled: "disabled", class: "form-control fieldSelect" }, fieldType);

                        this._createFieldDataTypeOptions(currentField, fieldTypeSelect);

                        fieldDescription = domConstruct.create("td", {}, fieldRow);
                        fieldDescriptionInput = domConstruct.create("input", { class: "form-control fieldDescription", placeholder: i18n.builder.fieldDescPlaceHolder, value: this.currentConfig.itemInfo.itemData.operationalLayers[layerIndex].popupInfo.fieldInfos[fieldIndex].tooltip }, fieldDescription);

                        currentIndex++;
                        if (configuredFieldName.indexOf(currentField.name) != -1) {
                            configuredFields[configuredFieldName.indexOf(currentField.name)];
                            domAttr.set(fieldCheckBoxInput, "checked", true);
                            domAttr.set(fieldLabelInput, "value", configuredFields[configuredFieldName.indexOf(currentField.name)].fieldLabel);
                            domAttr.set(fieldDescriptionInput, "value", configuredFields[configuredFieldName.indexOf(currentField.name)].fieldDescription);
                        }
                    }
                }));
            }
        },

        //function to fetch the datatype of the field
        _createFieldDataTypeOptions: function (currentField, fieldTypeSelect) {
            var fieldTypeSelectOption;
            fieldTypeSelectOption = domConstruct.create("option", {}, null);
            fieldTypeSelectOption.text = currentField.type.split("esriFieldType")[1];
            fieldTypeSelectOption.value = currentField.type.split("esriFieldType")[1];
            fieldTypeSelect.appendChild(fieldTypeSelectOption);
        },

        //function to query layer in order to obtain all the information of layer
        _queryLayer: function (layerUrl) {
            var layerDeferred = new Deferred();
            esriRequest({
                url: layerUrl,
                content: {
                    token: this.userInfo.token,
                    f: 'json'
                }
            }, { usePost: true }).then(lang.hitch(this, function (result) {
                this._validateFeatureServer(result, layerUrl);
                layerDeferred.resolve(true);
            }),
            function (error) {
                alert(error);
                layerDeferred.resolve(true);
            });
            return layerDeferred.promise;
        },

        //function to filter editable layers from all the layers in webmap
        _validateFeatureServer: function (layerInfo, layerUrl) {
            if (layerInfo.capabilities.search("Create") != -1 && layerInfo.capabilities.search("Update") != 1) {
                var filteredLayer;
                filteredLayer = document.createElement("option");
                filteredLayer.text = layerInfo.name;
                filteredLayer.value = layerInfo.name;
                dom.byId("selectLayer").appendChild(filteredLayer);
                this.fieldInfo[layerInfo.name] = {};
                this.fieldInfo[layerInfo.name].Fields = layerInfo.fields;
                this.fieldInfo[layerInfo.name].layerUrl = layerUrl;
                if (layerInfo.name == this.currentConfig.layer) {
                    this._populateFields(layerInfo.name);
                    filteredLayer.selected = "selected";
                }
            }
        },

        //function to allow user to udate/select webmap from the list
        _initWebmapSelection: function () {
            var browseParams = {
                portal: this.userInfo.portal,
                galleryType: "webmap" //valid values are webmap or group
            };
            this.browseDlg = new BrowseIdDlg(browseParams, this.userInfo);
            on(this.browseDlg, "close", lang.hitch(this, function () {
                if (this.browseDlg.get("selected") !== null && this.browseDlg.get("selectedWebmap") !== null) {
                    if (this.browseDlg.get("selectedWebmap").thumbnailUrl) {
                        domAttr.set(query(".img-thumbnail")[0], "src", this.browseDlg.get("selectedWebmap").thumbnailUrl.split("?token")[0]);
                        this.currentConfig.webmapThumbnailUrl = this.browseDlg.get("selectedWebmap").thumbnailUrl.split("?token")[0];
                    } else {
                        domAttr.set(query(".img-thumbnail")[0], "src", "");
                    }
                    this.currentConfig.webmap = this.browseDlg.get("selectedWebmap").id;
                    domClass.add(document.body, "app-loading");
                    arcgisUtils.getItem(this.currentConfig.webmap).then(lang.hitch(this, function (itemInfo) {
                        this.currentConfig.fields.length = 0;
                        domConstruct.empty(this.geoFormFieldsTable);
                        this.currentConfig.itemInfo = itemInfo;
                        this._addOperationalLayers();
                        domClass.remove(document.body, "app-loading");
                    }), function (error) {
                        console.log(error);
                    });

                }
            }));

            on(dom.byId("selectWebmapBtn"), "click", lang.hitch(this, function () {
                this.browseDlg.show();
            }));

            if (this.currentConfig.webmapThumbnailUrl) {
                domAttr.set(query(".img-thumbnail")[0], "src", this.currentConfig.webmapThumbnailUrl);
            }
        },

        //function to load the css on runtime
        _loadCSS: function (sourcePath) {
            //Load browser dialog
            var cssStyle = document.createElement('link');
            cssStyle.rel = 'stylesheet';
            cssStyle.type = 'text/css';
            cssStyle.href = sourcePath;
            document.getElementsByTagName('head')[0].appendChild(cssStyle);
        },

        //function to remove all the layers from the select box
        _clearLayerOptions: function () {
            var i;
            for (i = dom.byId("selectLayer").options.length - 1; i >= 0; i--) {
                if (dom.byId("selectLayer").options[i].value != "Select Layer") {
                    dom.byId("selectLayer").remove(i);
                }
            }
        },

        //function takes the previous tab's details as input parameter and saves the setting to config
        _updateAppConfiguration: function (prevNavigationTab) {
            var _self = this;
            switch (prevNavigationTab) {
                case "webmap":
                    this.currentConfig.webmap = this.browseDlg.get("selectedWebmap").id;
                    break;
                case "details":
                    this.currentConfig.details.Title = dom.byId("detailTitleInput").value;
                    this.currentConfig.details.Logo = dom.byId("detailLogoInput").value;
                    this.currentConfig.details.Description = dom.byId("detailDescriptionInput").value;
                    break;
                case "fields":
                    this.currentConfig.fields.length = 0;
                    var index, fieldName, fieldLabel, fieldType, fieldDescription, nullable, domain, defaultValue, sqlType,
                    layerName, fieldIndex;

                    array.forEach(query(".fieldCheckbox:checked"), lang.hitch(this, function (currentCheckedField) {

                        index = currentCheckedField.getAttribute("index");
                        fieldIndex = currentCheckedField.getAttribute("fieldIndex");
                        layerName = dom.byId("selectLayer").value;
                        fieldName = query(".fieldName")[index].innerHTML;
                        fieldLabel = query(".fieldLabel")[index].value;
                        fieldType = query(".fieldSelect")[index].value;
                        fieldDescription = query(".fieldDescription")[index].value;
                        nullable = this.fieldInfo[layerName].Fields[fieldIndex].nullable;
                        domain = this.fieldInfo[layerName].Fields[fieldIndex].domain;
                        defaultValue = this.fieldInfo[layerName].Fields[fieldIndex].defaultValue;
                        sqlType = this.fieldInfo[layerName].Fields[fieldIndex].sqlType;
                        _self.currentConfig.fields.push({
                            fieldName: fieldName, fieldLabel: fieldLabel,
                            fieldType: fieldType, fieldDescription: fieldDescription,
                            nullable: nullable, domain: domain,
                            defaultValue: defaultValue, sqlType: sqlType
                        });
                    }));
                    break;
                default:
            }
        },

        //function to update the item on arcGis online
        _updateItem: function () {
            this.currentConfig.edit = "";
            lang.mixin(this.response.itemData.values, this.currentConfig);
            this.response.item.tags = typeof (this.response.item.tags) == "object" ? this.response.item.tags.join(',') : this.response.item.tags;
            this.response.item.typeKeywords = typeof (this.response.item.typeKeywords) == "object" ? this.response.item.typeKeywords.join(',') : this.response.item.typeKeywords;
            var rqData = lang.mixin(this.response.item, {
                id: this.currentConfig.appid,
                item: this.currentConfig.appid,
                itemType: "text",
                f: 'json',
                token: this.userInfo.token,
                title: this.currentConfig.details.Title ? this.currentConfig.details.Title : "Geo Form",
                text: JSON.stringify(this.response.itemData),
                type: "Web Mapping Application",
                overwrite: true
            });
            domClass.add(document.body, "app-loading");
            arcgisUtils.getItem(this.currentConfig.appid).then(lang.hitch(this, function (response) {
                var updateURL = this.userInfo.portal.url + "/sharing/content/users/" + this.userInfo.username + (response.item.ownerFolder ? ("/" + response.item.ownerFolder) : "") + "/items/" + this.currentConfig.appid + "/update";
                esriRequest({
                    url: updateURL,
                    content: rqData,
                    handleAs: 'json'
                }, { usePost: true }).then(lang.hitch(this, function (result) {
                    if (result.success) {
                        domClass.remove(document.body, "app-loading");
                    }
                }), function () {
                    domClass.remove(document.body, "app-loading");
                    alert("Error");
                });
            }));
        },

        //function to enable the tab passed in input parameter
        _enableTab: function (currentTab) {
            if (domClass.contains(currentTab, "btn")) {
                domClass.remove(currentTab, "disabled");
            }
            else {
                domClass.remove(currentTab.parentNode, "disabled");
            }
            domAttr.set(currentTab, "data-toggle", "tab");
        },

        //function to disable the tab passed in input parameter
        _disableTab: function (currentTab) {
            if (domClass.contains(currentTab, "btn")) {
                domClass.add(currentTab, "disabled");
            }
            else {
                domClass.add(currentTab.parentNode, "disabled");
            }
            domAttr.set(currentTab, "data-toggle", "");
        },

        _getFieldCheckboxState: function () {
            array.forEach(query(".navigationTabs"), lang.hitch(this, function (currentTab) {
                if ((domAttr.get(currentTab, "tab") === "preview" || domAttr.get(currentTab, "tab") === "publish") && (query(".fieldCheckbox:checked").length === 0)) {
                    this._disableTab(currentTab);
                }
                else {
                    this._enableTab(currentTab);
                }
            }));
        }
    });
});