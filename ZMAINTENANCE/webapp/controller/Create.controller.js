sap.ui.define([
	"ZPM/ZMAINTENANCE/controller/BaseController", 
	"sap/ui/model/json/JSONModel",
	'sap/m/MessageToast',
	'sap/ui/core/Fragment',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	"sap/ui/core/library",
	"sap/ui/unified/library",
	'sap/ui/core/format/DateFormat',
	'sap/m/Input',
	"sap/m/MessageBox"
], function(BaseController, JSONModel, MessageToast, Fragment, Filter, FilterOperator, CoreLibrary, UnifiedLibrary,
	DateFormat, Input, MessageBox) {
	"use strict";
	var ValueState = CoreLibrary.ValueState;
	return BaseController.extend("ZPM.ZMAINTENANCE.controller.Create", {
	onInit: function() {
		var oModel = new JSONModel();
		this.getView().byId("addOperation").setModel(oModel);
		var sUrl = "/sap/opu/odata/sap/ZMAINTENANCE_SRV/";
	    oModel = new sap.ui.model.odata.ODataModel(sUrl, true);
	    oModel.setSizeLimit(500);
	    this.getView().setModel(oModel);
	    
	},
	handleChange: function (oEvent) {
		var oDP = oEvent.getSource(),
			sValue = oEvent.getParameter("value");
		
		var Today = new Date();
		
		Today = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: 'M/d/yy'
            }).format(Today);


		if (sValue >= Today) {
			oDP.setValueState(ValueState.None);
		} else {
			oDP.setValueState(ValueState.Error);
		}
	},
	_getAddOpDialog : function () {
	    	if (!this._oDialog) {
	            this._oDialog = sap.ui.xmlfragment("ZPM.ZMAINTENANCE.model.AddOperationNEWORDER", this);
	           this.getView().addDependent(this._oDialog);
	         }
	         return this._oDialog;
	}, 
	onAdd: function() {
	// Get the values of the header input fields
		this._getAddOpDialog().open();
	},
	onSaveOp: function() {
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
			var LongText = oController.getuserval("Long_Text").toString();
			
			if (CKEY === "" && D === "" && Q === "" && C === "" && A === "" && PO === "" &&
			PT === "" && UNIT === "")
			{
				alert("No fields can be blank");
			}
			else
			{
				var operation = {
					contKey: CKEY,
					desc: D,
					quantity: Q,
					curr: C,
					activityType: A ,
					purOrg: PO,
					Plan_Time: PT,
					Time_Unit: UNIT,
					Long_Text: LongText
				};
				var oTable1 = this.getView().byId("addOperation");
				oModel = oTable1.getModel();
				var operationData = oModel.getData().data;
				
				if (typeof operationData !== "undefined" && operationData!== null
					& operationData.length > 0) {
						// Append the data using .push
						operationData.push(operation);
				} else {
					operationData = [];
					// Append empty row
						operationData.push(operation);
				}
				
					// Set Model
				oModel.setData({
				data: operationData
				});
				
				var oCore = sap.ui.getCore();
				// Clear the input fields.
				oCore.byId("Desc").setValue("");
				oCore.byId("Plan_Time").setValue("");
				oCore.byId("Long_Text").setValue("");
			}
		return operationData;
		
	},
	onCloseNewOp: function () {
	         this._getAddOpDialog().close();
			if (this._oDialog) {
        		this._oDialog.destroy(true);
        		this._oDialog = null;
    		}
	},
	onDelete: function() {
		var oTable = this.getView().byId("addOperation");
		var oModel2 = oTable.getModel();
		var operationData = oModel2.getData().data;
		var aContexts = oTable.getSelectedContexts();
		var i;
		
			for (i = aContexts.length - 1; i >= 0; i--) 
			{
				// Selected Row
				var oThisObj = aContexts[i].getObject();
				
				// $.map() is used for changing the values of an array.
				// Here we are trying to find the index of the selected row
				// refer – http://api.jquery.com/jquery.map/
				var index = $.map(operationData, function(obj, index) {
				
				if (obj === oThisObj) {
					return index;
				}
				});
				
				// The splice() method adds/removes items to/from an array
				// Here we are deleting the selected index row
				operationData.splice(index, 1);
			}
		//Set the Model with the Updated Data after Deletion
		oModel2.setData({
		data: operationData
		});
		
		oTable.removeSelections(true);
		return operationData;
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
			if (oVal1 === "Long_Text")
			{
				oVal1 = oCore.byId("Long_Text").getValue();
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

			return oVal1;
		},
	onSave: function(event) { 
	var shortText = this.getView().byId("inputST").getValue();
	var orderType = this.getView().byId("inputORDER_TYPE").getValue();
	var plant = this.getView().byId("inputPlant").getValue();
	var pmActType = this.getView().byId("inputPMActType").getValue();
	var mnWorkCtr = this.getView().byId("inputMN_WK_CTR").getValue();
	var equipment = this.getView().byId("inputEquipment").getValue();
	var start = this.getView().byId("inputSTART").getValue();
	var finish = this.getView().byId("inputFINISH").getValue();

	var Today = new Date();
		
	Today = sap.ui.core.format.DateFormat.getDateInstance({
            pattern: 'M/d/yy'
    }).format(Today);


		if (start >= Today) {
			// do nothing
		} else {
			alert("Start Date is in the past!");
		}
		
		if (finish >= Today && finish >= start) {
			// do nothing
		} else {
			alert("Finish Date is in the past!");
		}
	
		if (shortText === "" && orderType === "" && plant === "" && pmActType === "" && mnWorkCtr === "" 
			&& equipment === "" &&  start === "" && finish === "") 
		{
			alert("No fields can be blank");
		}
	
	var oModel = this.getModel();
	var oTable = this.getView().byId("addOperation");
	var oModel2 = oTable.getModel();
	
	var operationData = oModel2.getData().data;

	var PURCH_ORG = '';
	var ACTIVITY_TYPE= '';
	var CURRENCY= '';
	var QUANTITY= '';
	var DESCRIPTION= '';
	var CONTROL_KEY= '';
	var PLAN_TIME='';
	var TIME_UNIT='';
	var LONG_TEXT='';
	
	function combineRows(item) {
	  PURCH_ORG = PURCH_ORG + item.purOrg + ',';
	  ACTIVITY_TYPE = ACTIVITY_TYPE + item.activityType + ',';
	  CURRENCY = CURRENCY + item.curr + ',';
	  QUANTITY = QUANTITY + item.quantity + ',';
	  DESCRIPTION = DESCRIPTION + item.desc + ',';
	  CONTROL_KEY = CONTROL_KEY + item.contKey + ',';
	  PLAN_TIME = PLAN_TIME + item.Plan_Time + ',';
	  TIME_UNIT = TIME_UNIT + item.Time_Unit + ',';
	  LONG_TEXT = LONG_TEXT + item.Long_Text + ',';
	}
	
	operationData.forEach(combineRows);

			oModel.callFunction("/CREATE", {
					"method": "GET",
					urlParameters: {
						SHORT_TEXT : shortText,
						ORDER_TYPE : orderType,
						PLANT : plant,
						PMACT_TYPE : pmActType,
						MN_WK_CTR : mnWorkCtr,
						EQUIPMENT : equipment,
						START_DATE : start,
						FINISH_DATE : finish,
						PURCH_ORG : PURCH_ORG,
						ACTIVITY_TYPE : ACTIVITY_TYPE,
						CURRENCY : CURRENCY,
						QUANTITY : QUANTITY,
						DESCRIPTION : DESCRIPTION,
						CONTROL_KEY : CONTROL_KEY,
						PLAN_TIME: PLAN_TIME,
						TIME_UNIT: TIME_UNIT,
						LONG_TEXT: LONG_TEXT
					},
					success: function(oData, oResponse) {
						if (oData.ERROR !== "E") {
							MessageBox.show(oData.MESSAGE, {
								icon: MessageBox.Icon.INFORMATION,
								title: "OrderSubmit",
								actions: [MessageBox.Action.OK],
								onClose: function(oAction) {}
							});
	
						}else{
						MessageBox.show(oData.MESSAGE, {
								icon: MessageBox.Icon.WARNING,
								title: "OrderSubmit",
								actions: [MessageBox.Action.OK],
								onClose: function(oAction) {}
							});	
						}
	
					},
					error: function(oError) {
						MessageBox.show("An unknown error occurred", {
							icon: MessageBox.Icon.INFORMATION,
							title: "OrderSubmit",
							actions: [MessageBox.Action.YES, MessageBox.Action.CANCEL],
							onClose: function(oAction) {}
						});
					}
				});
		}
	});
});