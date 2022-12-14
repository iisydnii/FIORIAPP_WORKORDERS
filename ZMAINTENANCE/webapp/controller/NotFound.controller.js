sap.ui.define([
		"ZPM/ZMAINTENANCE/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("ZPM.ZMAINTENANCE.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);