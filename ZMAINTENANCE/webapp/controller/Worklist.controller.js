/*global location history */
sap.ui.define([
		"ZPM/ZMAINTENANCE/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/routing/History",
		"ZPM/ZMAINTENANCE/model/formatter",
		"sap/ui/model/Sorter",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/FilterType",
		'sap/ui/core/util/Export',
		'sap/ui/core/util/ExportTypeCSV',
		'sap/m/MessageBox'
	], function (BaseController, JSONModel, History, formatter, Sorter, Filter, FilterOperator, FilterType, Export, ExportTypeCSV, MessageBox) {
		"use strict";

		return BaseController.extend("ZPM.ZMAINTENANCE.controller.Worklist", {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit: function() {
				var oViewModel,
					iOriginalBusyDelay,
					oTable = this.byId("table");
	
				// Put down worklist table's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the table is
				// taken care of by the table itself.
				iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
				this._oTable = oTable;
				// keeps the search state
				this._aTableSearchState = [];
	
				// Model used to manipulate control states
				oViewModel = new JSONModel({
					worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
					saveAsTileTitle: this.getResourceBundle().getText("saveAsTileTitle", this.getResourceBundle().getText("worklistViewTitle")),
					shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
					shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
					shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
					tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
					tableBusyDelay: 0,
					upcoming: 0,
					current: 0,
					pastdue: 0,
					all: 0,
					order : 0
				});
				this.setModel(oViewModel, "worklistView");
				
				this._mFilters = {
					"upcoming": [new Filter("FINISH_DATE", "GT", Date.now())],
					"current": [new Filter("FINISH_DATE", "EQ", Date.now())],
					"pastdue": [new Filter("FINISH_DATE", "LT", Date.now())],
					"all": []
				};
				// Make sure, busy indication is showing immediately so there is no
				// break after the busy indication for loading the view's meta data is
				// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
				oTable.attachEventOnce("updateFinished", function(){
					// Restore original busy indicator delay for worklist's table
					oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
				});
				// Add the worklist page to the flp routing history
				this.addHistoryEntry({
					title: this.getResourceBundle().getText("worklistViewTitle"),
					icon: "sap-icon://table-view",
					intent: "#Workorders-display"
				}, true);
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Triggered by the table's 'updateFinished' event: after new table
			 * data is available, this handler method updates the table counter.
			 * This should only happen if the update was successful, which is
			 * why this handler is attached to 'updateFinished' and not to the
			 * table's list binding's 'dataReceived' method.
			 * @param {sap.ui.base.Event} oEvent the update finished event
			 * @public
			 */
		onUpdateFinished: function(oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				oViewModel = this.getModel("worklistView"),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
				this.getModel().read("/WorkOrderListSet/$count", {
					success: function(oData) {
						oViewModel.setProperty("/all", oData);
					}
				});

				this.getModel().read("/WorkOrderListSet/$count", {
					success: function(oData) {
						oViewModel.setProperty("/upcoming", oData);
					},
					filters: this._mFilters.upcoming
				});

				this.getModel().read("/WorkOrderListSet/$count", {
					success: function(oData) {
						oViewModel.setProperty("/current", oData);
					},
					filters: this._mFilters.current
				});
				// read the count for the shortage filter
				this.getModel().read("/WorkOrderListSet/$count", {
					success: function(oData) {
						oViewModel.setProperty("/pastdue", oData);
					},
					filters: this._mFilters.pastdue
				});
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},

			/**
			 * Event handler when a table item gets pressed
			 * @param {sap.ui.base.Event} oEvent the table selectionChange event
			 * @public
			 */
			onPress : function (oEvent) {
				// The source is the list item that got pressed
				this._showObject(oEvent.getSource());
			},


			/**
			 * Event handler when the share in JAM button has been clicked
			 * @public
			 */
			onShareInJamPress : function () {
				var oViewModel = this.getModel("worklistView"),
					oShareDialog = sap.ui.getCore().createComponent({
						name: "sap.collaboration.components.fiori.sharing.dialog",
						settings: {
							object:{
								id: location.href,
								share: oViewModel.getProperty("/shareOnJamTitle")
							}
						}
					});
				oShareDialog.open();
			},

			onSearch : function (oEvent) {
				if (oEvent.getParameters().refreshButtonPressed) {
					// Search field's 'refresh' button has been pressed.
					// This is visible if you select any master list item.
					// In this case no new search is triggered, we only
					// refresh the list binding.
					this.onRefresh();
				} else {
					var aTableSearchState = [];
					var sQuery = oEvent.getParameter("query");

					if (sQuery && sQuery.length > 0) {
						aTableSearchState = [new Filter("ORDERID", FilterOperator.Contains, sQuery)];
					}
					this._applySearch(aTableSearchState);
				}

			},

			/**
			 * Event handler for refresh event. Keeps filter, sort
			 * and group settings and refreshes the list binding.
			 * @public
			 */
			onRefresh : function () {
				var oTable = this.byId("table");
				oTable.getBinding("items").refresh();
			},

			/* =========================================================== */
			/* internal methods                                            */
			/* =========================================================== */

			/**
			 * Shows the selected item on the object page
			 * On phones a additional history entry is created
			 * @param {sap.m.ObjectListItem} oItem selected Item
			 * @private
			 */
			_showObject : function (oItem) {
				this.getRouter().navTo("object", {
					objectId: oItem.getBindingContext().getProperty("ORDERID")
				});
			},

			/**
			 * Internal helper method to apply both filter and search state together on the list binding
			 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
			 * @private
			 */
		_applySearch: function(aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		},
		onQuickFilter: function(oEvent) {
			var oBinding = this._oTable.getBinding("items"),
				sKey = oEvent.getParameter("selectedKey");
			oBinding.filter(this._mFilters[sKey]);
		},
		onCreate: function (oEvent) 
		{
				this._showCreate(oEvent.getSource());
		},
		_showCreate : function (oItem) {
				this.getRouter().navTo("create", {
				});
		},
		onDataExport: function(oEvent) {

			var oExport = new Export({

				// Type that will be used to generate the content. Own ExportType's can be created to support other formats
				exportType: new ExportTypeCSV({
					separatorChar: ","
				}),

				// Pass in the model created above
				models: this.getView().getModel(),

				// binding information for the rows aggregation
				rows: {
					path: "/WorkOrderListSet"
				},

				// column definitions with column name and binding info for the content

				columns: [{
					name: "Order",
					template: {
						content: "ORDERID"
					}
				}, {
					name: "Type",
					template: {
						content: "{ORDER_TYPE}"
					}
				}, {
					name: "Description",
					template: {
						content: "{SHORT_TEXT}"
					}
				}, {
					name: "Location",
					template: {
						content: "{FUNCLDESCR}"
					}
				}, {
					name: "Equipment",
					template: {
						content: "{EQUIDESCR}"
					}
				}, {
					name: "Required End",
					template: {
						content: "{START_DATE}"
					}
				}]
			});

			// download exported file
			oExport.saveFile().catch(function(oError) {
				MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
			}).then(function() {
				oExport.destroy();
			});
		}

	});
});