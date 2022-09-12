sap.ui.define([
	] , function () {
		"use strict";

		return {

			/**
			 * Rounds the number unit value to 2 digits
			 * @public
			 * @param {string} sValue the number string to be rounded
			 * @returns {string} sValue with 2 digits rounded
			 */
			numberUnit : function (sValue) {
				if (!sValue) {
					return "";
				}
				return parseFloat(sValue).toFixed(2);
			},
			trimsix : function (sValue) {
				if (!sValue) {
					return "";
				}
				return sValue.replace("00000","");
			},
			trimleadzero : function (sValue) {
				if (!sValue) {
					return "";
				}
				return sValue.replace(/^0+/, '');
			},date: function(value) {
			if (value) {
				var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: "MM/dd/yyyy"
				});
				return oDateFormat.format(new Date(value));
			} else {
				return value;
			}
		}

		};

	}
);