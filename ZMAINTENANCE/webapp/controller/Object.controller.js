/*global location*/
sap.ui.define([
		"ZPM/ZMAINTENANCE/controller/BaseController",
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/routing/History",
		"ZPM/ZMAINTENANCE/model/formatter",
		"sap/ui/model/Filter",
		"sap/m/MessageToast",
		"sap/ui/core/Fragment",
		"sap/ui/model/FilterOperator", 
		"sap/m/MessageBox", 
		"sap/ui/core/library",
		'sap/ui/core/format/DateFormat'
	], function (
		BaseController,Controller, JSONModel, History, formatter, Filter, MessageToast,
		Fragment, FilterOperator, MessageBox, CoreLibrary, DateFormat
	) {
		"use strict";
		var ValueState = CoreLibrary.ValueState;
		return BaseController.extend("ZPM.ZMAINTENANCE.controller.Object", {

			formatter: formatter,

			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit : function () {
				// Model used to manipulate control states. The chosen values make sure,
				// detail page is busy indication immediately so there is no break in
				// between the busy indication for loading the view's meta data
				var iOriginalBusyDelay,
					oViewModel = new JSONModel({
						busy: true,
						delay: 0,
						operation: '',
						order:'',
						minutes:''
					});

				this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

				// Store original busy indicator delay, so it can be restored later on
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
				this.setModel(oViewModel, "objectView");
				this.getOwnerComponent().getModel().metadataLoaded().then(function () {
						// Restore original busy indicator delay for the object view
						oViewModel.setProperty("/delay", iOriginalBusyDelay);
					}
				);
			
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Event handler when the share in JAM button has been clicked
			 * @public
			 */
			onShareInJamPress : function () {
				var oViewModel = this.getModel("objectView"),
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


			/* =========================================================== */
			/* internal methods                                            */
			/* =========================================================== */

			/**
			 * Binds the view to the object path.
			 * @function
			 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
			 * @private
			 */
			_onObjectMatched: function(oEvent) {
				var sObjectId = oEvent.getParameter("arguments").objectId;
				// build filter array
				//	var sObjectId = sObjectPath.getParameter("arguments").objectId;
				var aFilter = [];
	
				aFilter.push(new Filter("ORDERID", "EQ", sObjectId));
	
				// filter binding
				var oList = this.getView().byId("idOperationsListTable");
				var oBinding = oList.getBinding("items");
				oBinding.filter(aFilter);
	
				this.getModel().metadataLoaded().then(function() {
					var sObjectPath = this.getModel().createKey("WorkOrderListSet", {
						ORDERID: sObjectId
					});
					this._bindView("/" + sObjectPath);
	
				}.bind(this));
			},

			/**
			 * Binds the view to the object path.
			 * @function
			 * @param {string} sObjectPath path to the object to be bound
			 * @private
			 */
			_bindView: function(sObjectPath) {
				var oViewModel = this.getModel("objectView"),
					oDataModel = this.getModel();
	
				this.getView().bindElement({
					path: sObjectPath,
					events: {
						change: this._onBindingChange.bind(this),
						dataRequested: function() {
							oDataModel.metadataLoaded().then(function() {
								// Busy indicator on view should only be set if metadata is loaded,
								// otherwise there may be two busy indications next to each other on the
								// screen. This happens because route matched handler already calls '_bindView'
								// while metadata is loaded.
								oViewModel.setProperty("/busy", true);
							});
						},
						dataReceived: function() {
							oViewModel.setProperty("/busy", false);
						}
					}
				});
			},

			_onBindingChange : function () {
				var oView = this.getView(),
					oViewModel = this.getModel("objectView"),
					oElementBinding = oView.getElementBinding();

				// No data for the binding
				if (!oElementBinding.getBoundContext()) {
					this.getRouter().getTargets().display("objectNotFound");
					return;
				}

				var oResourceBundle = this.getResourceBundle(),
					oObject = oView.getBindingContext().getObject(),
					sObjectId = oObject.ORDERID,
					sObjectName = oObject.SHORT_TEXT;

				oViewModel.setProperty("/busy", false);
				// Add the object page to the flp routing history
				this.addHistoryEntry({
					title: this.getResourceBundle().getText("objectTitle") + " - " + sObjectName,
					icon: "sap-icon://enter-more",
					intent: "#Workorders-display&/WorkOrderListSet/" + sObjectId
				});

				oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [sObjectName]));
				oViewModel.setProperty("/shareOnJamTitle", sObjectName);
				oViewModel.setProperty("/shareSendEmailSubject",
					oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
				oViewModel.setProperty("/shareSendEmailMessage",
					oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		  },
		  handleChange: function (oEvent) {
			var oDP = oEvent.getSource(),
				sValue = oEvent.getParameter("value");
			
			var Today = new Date();
			
			Today = sap.ui.core.format.DateFormat.getDateInstance({
	                pattern: 'M/d/yy'
	            }).format(Today);
	
	
			if (sValue <= Today) {
				oDP.setValueState(ValueState.None);
			} else {
				oDP.setValueState(ValueState.Error);
			}
		},
//Open Dialogs	
		onRelease : function (e) {
			 var o = e.getSource().getBindingContext().getProperty("ORDERID");
			 this._getRelease(o).open();
	      },
		onEditHeader : function (e) {
			 var o = e.getSource().getBindingContext().getProperty("ORDERID");
			 var oView = this.getView();
        	 var oDialog = oView.byId("Edit_Header_Dialog");
        	 
        	 var sUrl = "/sap/opu/odata/sap/ZMAINTENANCE_SRV/";
			 var oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
		    	oModel.setSizeLimit(500);
		    	//Problem Here
		    	// this.getView().setModel(oModel);

        	 if (!oDialog) {
            	// create dialog via fragment factory
	            oDialog = sap.ui.xmlfragment(oView.getId(), "ZPM.ZMAINTENANCE.model.EditHeader", this);
	            oView.addDependent(oDialog);
	         }

	         this._getEditHDialog(o).open();
	      },	
		onEditOperation : function (e) {
			 var o = e.getSource().getBindingContext().getProperty("ORDERID");
			 var op = e.getSource().getBindingContext().getProperty("OPERATION");
	         this._getEditOpDialog(o, op).open();
	      },	
	  	onAdd : function (e) {
			 var o = e.getSource().getBindingContext().getProperty("ORDERID");
	         this._getAddOpDialog(o).open();
	      },
	    onOpenDialog : function (e) {
			 var o = e.getSource().getBindingContext().getProperty("OPERATION");
	         this._getDialog(o).open();
	      },
//Get Dialogs
		_getRelease : function (o) {
	    	if (!this._oDialog) {
	            this._oDialog = sap.ui.xmlfragment("ZPM.ZMAINTENANCE.model.Release", this);
	           this.getView().addDependent(this._oDialog);
	         }
	         this._oDialog.mProperties.orderid = o;
	         
	         return this._oDialog;
	      }, 
		_getEditHDialog : function (o) {
	    	if (!this._oDialog) {
	            this._oDialog = sap.ui.xmlfragment("ZPM.ZMAINTENANCE.model.EditHeader", this);
	           this.getView().addDependent(this._oDialog);
	         }
	         this._oDialog.mProperties.orderid = o;
	         
	         return this._oDialog;
	      }, 
		_getEditOpDialog : function (o, op) {
	    	if (!this._oDialog) {
	            this._oDialog = sap.ui.xmlfragment("ZPM.ZMAINTENANCE.model.EditOperation", this);
	           this.getView().addDependent(this._oDialog);
	         }
	         this._oDialog.mProperties.orderid = o;
	         this._oDialog.mProperties.operation = op;
	         return this._oDialog;
	      }, 
	    _getAddOpDialog : function (o) {
	    	if (!this._oDialog) {
	            this._oDialog = sap.ui.xmlfragment("ZPM.ZMAINTENANCE.model.AddOperation", this);
	           this.getView().addDependent(this._oDialog);
	         }
	         this._oDialog.mProperties.orderid = o;
	         return this._oDialog;
	      }, 
		_getDialog : function (o) {
	         if (!this._oDialog) {
	            this._oDialog = sap.ui.xmlfragment("ZPM.ZMAINTENANCE.model.Dialog", this);
	           this.getView().addDependent(this._oDialog);
	         }
	         this._oDialog.mProperties.operation = o;
	         return this._oDialog;
	      },
// Close Dialogs
		onCloseRelease : function () {
			this._getRelease().close();
			if (this._oDialog) {
        		this._oDialog.destroy(true);
        		this._oDialog = null;
    		}
	      },
		onCloseEditHDialog : function () {
			this._getEditHDialog().close();
			if (this._oDialog) {
        		this._oDialog.destroy(true);
        		this._oDialog = null;
    		}
	      },
	    onCloseDialog : function () {
	         this._getDialog().close();
			if (this._oDialog) {
        		this._oDialog.destroy(true);
        		this._oDialog = null;
    		}
	      },
	    onCloseNewOpDialog : function () {
	         this._getAddOpDialog().close();
			if (this._oDialog) {
        		this._oDialog.destroy(true);
        		this._oDialog = null;
    		}
	      },
	    onCloseEditOpDialog : function () {
	         this._getEditOpDialog().close();
			if (this._oDialog) {
        		this._oDialog.destroy(true);
        		this._oDialog = null;
    		}
	      },
//Save dialog Info
		onSaveRelease : function(event) {
	      	var oModel = this.getModel();
			
					oModel.callFunction("/RELEASE", {
					"method": "GET",
					urlParameters: {
						ORDERID: event.getSource().getBindingContext().getProperty("ORDERID")
					},
					success: function(oData, oResponse) {
						if (oData.ERROR !== "E") {
							MessageBox.show(oData.MESSAGE, {
								icon: MessageBox.Icon.INFORMATION,
								title: "Release Order",
								actions: [MessageBox.Action.OK],
								onClose: function(oAction) {
									
								}
							});
							this._getRelease().close();
							if (this._oDialog) {
				        		this._oDialog.destroy(true);
				        		this._oDialog = null;
				    		}
	
						}else{
						MessageBox.show(oData.MESSAGE, {
								icon: MessageBox.Icon.WARNING,
								title: "Release Order",
								actions: [MessageBox.Action.OK],
								onClose: function(oAction) {}
							});	
						}
	
					},
					error: function(oError) {
						MessageBox.show("An unknown error occurred", {
							icon: MessageBox.Icon.INFORMATION,
							title: "Release Order",
							actions: [MessageBox.Action.OK],
							onClose: function(oAction) {}
						});
					}
				});
				this.onCloseRelease();
	      },
		onSaveOpChange: function(event) {
			var oModel = this.getModel();
			var oView = this.getView();
			var oController = oView.getController();
			var D = oController.getuserval("Desc").toString();
			var Q = oController.getuserval("quantity").toString();
			
			oModel.callFunction("/EDIT_O", {
				"method": "GET",
				urlParameters: {
					ORDERID: event.getSource().getBindingContext().getProperty("ORDERID"),
					PATH_INC: "3",
					OPERATION: this._oDialog.mProperties.operation,
					DESCRIPTION: D,
					QTY: Q
					
				},
			success: function(oData, oResponse) {
				if (oData.ERROR !== "E") {
					MessageBox.show(oData.MESSAGE, {
						icon: MessageBox.Icon.INFORMATION,
						title: "EDIT_OPERATION",
						actions: [MessageBox.Action.OK],
						onClose: function(oAction) {}
					});

				}else{
				MessageBox.show(oData.MESSAGE, {
						icon: MessageBox.Icon.WARNING,
						title: "EDIT_OPERATION",
						actions: [MessageBox.Action.OK],
						onClose: function(oAction) {}
					});	
				}

			},
				error: function(oError) {
					MessageBox.show("An unknown error occurred", {
						icon: MessageBox.Icon.INFORMATION,
						title: "EDIT_OPERATION",
						actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
						onClose: function(oAction) {}
					});
				}
			});	
		},
		onSaveHChange: function(event) {
			var oModel = this.getModel();
			var oView = this.getView();
			var oController = oView.getController();
			var SHORT_TEXT = oController.getuserval("SHORT_TEXT").toString();
			var START = oController.getuserval("START").toString();
			var FINISH = oController.getuserval("FINISH").toString();
			var EQUIP = oController.getuserval("EQUIP").toString();
			var Today = new Date();
		
			Today = sap.ui.core.format.DateFormat.getDateInstance({
		            pattern: 'M/d/yy'
		    }).format(Today);

				if (START >= Today) {
					// do nothing
				} else {
					alert("Start Date is in the past!");
				}
				
				if (FINISH >= Today && FINISH >= START) {
					// do nothing
				} else {
					alert("Finish Date is in the past!");
				}
			
			
			oModel.callFunction("/EDIT_H", {
				"method": "GET",
				urlParameters: {
					ORDERID: event.getSource().getBindingContext().getProperty("ORDERID"),
					PATH_INC: "2",
					SHORT_TEXT: SHORT_TEXT,
					START: START,
					FINISH: FINISH,
					EQUIP: EQUIP
				},
			success: function(oData, oResponse) {
				if (oData.ERROR !== "E") {
					MessageBox.show(oData.MESSAGE, {
						icon: MessageBox.Icon.INFORMATION,
						title: "EDIT_HEADER",
						actions: [MessageBox.Action.OK],
						onClose: function(oAction) {}
					});

				}else{
				MessageBox.show(oData.MESSAGE, {
						icon: MessageBox.Icon.WARNING,
						title: "EDIT_HEADER",
						actions: [MessageBox.Action.OK],
						onClose: function(oAction) {}
					});	
				}

			},
				error: function(oError) {
					MessageBox.show("An unknown error occurred", {
						icon: MessageBox.Icon.INFORMATION,
						title: "EDIT_HEADER",
						actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
						onClose: function(oAction) {}
					});
				}
			});	
		},
		onSaveOp : function(event) {
			var oModel = this.getModel();
			var oView = this.getView();
			var oController = oView.getController();
			var CKEY = oController.getuserval("Control_Key").toString();
			var D = oController.getuserval("Desc").toString();
			var Q = oController.getuserval("quantity").toString();
			var C = oController.getuserval("currency").toString();
			var A = oController.getuserval("ActType").toString();
			var PO = oController.getuserval("purOrg").toString();
			var PT = oController.getuserval("Plan_Time").toString();
			var UNIT = oController.getuserval("Time_Unit").toString();
			var B = oController.getuserval("BATCH").toString();
			var M = oController.getuserval("MATNR").toString();
			var GL = oController.getuserval("GL").toString();
			var IC = oController.getuserval("ITM_CAT").toString();
			
			oModel.callFunction("/ADD_OP", {
				"method": "GET",
				urlParameters: {
					ORDERID: event.getSource().getBindingContext().getProperty("ORDERID"),
					PATH_INC: "1",
					CONTROL_KEY: CKEY,
					DESCRIPTION: D,
					QTY: Q,
					CURRENCY: C,
					ACTTYPE: A,
					PURCH_ORG: PO,
					PLANNED_TIME: PT,
					TIME_UNIT: UNIT,
					BATCH: B,
					MATNR: M,
					GL_Account: GL,
					ITEM_CAT: IC
					
				},
			success: function(oData, oResponse) {
				if (oData.ERROR !== "E") {
					MessageBox.show(oData.MESSAGE, {
						icon: MessageBox.Icon.INFORMATION,
						title: "ADD_OPERATION",
						actions: [MessageBox.Action.OK],
						onClose: function(oAction) {}
					});

				}else{
				MessageBox.show(oData.MESSAGE, {
						icon: MessageBox.Icon.WARNING,
						title: "ADD_OPERATION",
						actions: [MessageBox.Action.OK],
						onClose: function(oAction) {}
					});	
				}

			},
				error: function(oError) {
					MessageBox.show("An unknown error occurred", {
						icon: MessageBox.Icon.INFORMATION,
						title: "ADD_OPERATION",
						actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
						onClose: function(oAction) {}
					});
				}
			});	
		},
	    onSave : function(event) {
	      	var oModel = this.getModel();
	      	var oView = this.getView();
			var oController = oView.getController();
			var a = oController.getuserval("Act_Minutes").toString();
			console.log(a);
			console.log(this._oDialog.mProperties.operation);
			
					oModel.callFunction("/SAVE_TIME", {
					"method": "GET",
					urlParameters: {
						ORDERID: event.getSource().getBindingContext().getProperty("ORDERID"),
						OPERATION: this._oDialog.mProperties.operation,
						ACT_WORK: a
					},
					success: function(oData, oResponse) {
						if (oData.ERROR !== "E") {
							MessageBox.show(oData.MESSAGE, {
								icon: MessageBox.Icon.INFORMATION,
								title: "TimeSubmit",
								actions: [MessageBox.Action.OK],
								onClose: function(oAction) {}
							});
	
						}else{
						MessageBox.show(oData.MESSAGE, {
								icon: MessageBox.Icon.WARNING,
								title: "TimeSubmit",
								actions: [MessageBox.Action.OK],
								onClose: function(oAction) {}
							});	
						}
	
					},
					error: function(oError) {
						MessageBox.show("An unknown error occurred", {
							icon: MessageBox.Icon.INFORMATION,
							title: "TimeSubmit",
							actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
							onClose: function(oAction) {}
						});
					}
				});
	      },
	    getuserval: function(oVal1){
			var oCore = sap.ui.getCore();
			if (oVal1 === "Act_Minutes")
			{
				oVal1 = oCore.byId("Act_Minutes").getValue();
			}
			if (oVal1 === "Control_Key")
			{
				oVal1 = oCore.byId("Control_Key").getValue();
			}
			if (oVal1 === "Desc")
			{
				oVal1 = oCore.byId("Desc").getValue();
			}
			if (oVal1 === "quantity")
			{
				oVal1 = oCore.byId("quantity").getValue();
			}
			if (oVal1 === "currency")
			{
				oVal1 = oCore.byId("currency").getValue();
			}
			if (oVal1 === "ActType")
			{
				oVal1 = oCore.byId("ActType").getValue();
			}
			if (oVal1 === "purOrg")
			{
				oVal1 = oCore.byId("purOrg").getValue();
			}
			if (oVal1 === "Plan_Time")
			{
				oVal1 = oCore.byId("Plan_Time").getValue();
			}
			if (oVal1 === "Time_Unit")
			{
				oVal1 = oCore.byId("Time_Unit").getValue();
			}
			if (oVal1 === "SHORT_TEXT")
			{
				oVal1 = oCore.byId("SHORT_TEXT").getValue();
			}
			if (oVal1 === "START")
			{
				oVal1 = oCore.byId("START").getValue();
			}
			if (oVal1 === "FINISH")
			{
				oVal1 = oCore.byId("FINISH").getValue();
			}
			if (oVal1 === "EQUIP")
			{
				oVal1 = oCore.byId("EQUIP").getValue();
			}
			if (oVal1 === "MATNR")
			{
				oVal1 = oCore.byId("MATNR").getValue();
			}
			if (oVal1 === "BATCH")
			{
				oVal1 = oCore.byId("BATCH").getValue();
			}
			if (oVal1 === "GL")
			{
				oVal1 = oCore.byId("GL").getValue();
			}
			if (oVal1 === "ITM_CAT")
			{
				oVal1 = oCore.byId("ITM_CAT").getValue();
			}
			
			return oVal1;
		},
		onComplete: function(event) {
			var oModel = this.getModel();
				oModel.callFunction("/MARK_COMPLETE", {
					"method": "GET",
					urlParameters: {
						ORDERID: event.getSource().getBindingContext().getProperty("ORDERID").toString()
					},
					success: function(oData, oResponse) {
						if (oData.ERROR !== "E") {
							MessageBox.show(oData.MESSAGE, {
								icon: MessageBox.Icon.INFORMATION,
								title: "Mark Complete",
								actions: [MessageBox.Action.OK],
								onClose: function(oAction) {}
							});
						}else{
						MessageBox.show(oData.MESSAGE, {
								icon: MessageBox.Icon.WARNING,
								title: "Mark Complete",
								actions: [MessageBox.Action.OK],
								onClose: function(oAction) {}
							});	
						}
					},
					error: function(oError) {
						MessageBox.show("An unknown error occurred", {
							icon: MessageBox.Icon.INFORMATION,
							title: "Mark Complete",
							actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
							onClose: function(oAction) {}
						});
					}
				});
		},
		readText: function(event) {
				var oModel = this.getModel();
				oModel.callFunction("/READ_TEXT", {
					"method": "GET",
					urlParameters: {
						ORDERID: event.getSource().getBindingContext().getProperty("ORDERID"),
						OPERATION: event.getSource().getBindingContext().getProperty("OPERATION")
					},
					success: function(oData, oResponse) {
						if (oData.ERROR != 'E') {
							MessageBox.show(oData.MESSAGE, {
								icon: MessageBox.Icon.INFORMATION,
								title: "LongText",
								actions: [MessageBox.Action.OK],
								onClose: function(oAction) {}
							});
	
						}else{
						MessageBox.show(oData.MESSAGE, {
								icon: MessageBox.Icon.WARNING,
								title: "LongText",
								actions: [MessageBox.Action.OK],
								onClose: function(oAction) {}
							});	
						}
	
					},
					error: function(oError) {
						MessageBox.show("An unknown error occurred", {
							icon: MessageBox.Icon.INFORMATION,
							title: "LongText",
							actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
							onClose: function(oAction) {}
						});
					}
				});
			}
		});
	
	});