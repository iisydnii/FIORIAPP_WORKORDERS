/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"ZPM/ZMAINTENANCE/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"ZPM/ZMAINTENANCE/test/integration/pages/Worklist",
	"ZPM/ZMAINTENANCE/test/integration/pages/Object",
	"ZPM/ZMAINTENANCE/test/integration/pages/NotFound",
	"ZPM/ZMAINTENANCE/test/integration/pages/Browser",
	"ZPM/ZMAINTENANCE/test/integration/pages/App"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "ZPM.ZMAINTENANCE.view."
	});

	sap.ui.require([
		"ZPM/ZMAINTENANCE/test/integration/WorklistJourney",
		"ZPM/ZMAINTENANCE/test/integration/ObjectJourney",
		"ZPM/ZMAINTENANCE/test/integration/NavigationJourney",
		"ZPM/ZMAINTENANCE/test/integration/NotFoundJourney",
		"ZPM/ZMAINTENANCE/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});