var Soap 				= require('soap');
var fs  				= require('fs');
var WSSecurityCertTBK	= require('./security/WSSecurityCertTBK');
/*
	Put the "secrets" dictionary here, you can modify its contents before initializing the TBK object
 */

function TBK( config ){
	var self 			= this;
	this.config 		= config;

	//Get and save certs in this object
	this.privateCert 	= fs.readFileSync(this.config.PRIVATE_KEY);
	this.publicCert 	= fs.readFileSync(this.config.PUBLIC_KEY);

	var wsSecurity 		= new WSSecurityCertTBK(this.privateCert, this.publicCert, '', 'utf8');

	this.soapClient 	= null;
	Soap.createClient(
		this.config.WSDL_PATH,
		function( error, client ){
			if( error ){
				console.error("SOAP Client error > "+error);
			}else{
				self.soapClient 	= client;
				self.soapClient.setSecurity(wsSecurity);

				console.log("TBK Client description > "+JSON.stringify(self.soapClient.describe()));
			}
		}
	);
}

TBK.prototype.initTransaction 	= function(amount, buyOrder, sessionId, returnURL, finalURL, callback /*F(error, result)*/) {
	if( !this.soapClient ){
		return console.error("SOAP Client not ready yet");
	}
	var initInput 	= {
		"wsInitTransactionInput" 	: {
            "wSTransactionType" 	: "TR_NORMAL_WS",
            "buyOrder" 				: buyOrder,
            "sessionId" 			: sessionId,
            "returnURL" 			: returnURL,
            "finalURL" 				: finalURL,
            "transactionDetails" 	: {
                "amount" 			: amount,
                "commerceCode" 		: this.config.COMMERCE_CODE,
                "buyOrder" 			: buyOrder
            }
        }
	};

	this.soapClient.WSWebpayServiceImplService.WSWebpayServiceImplPort.initTransaction(initInput, callback);
};

TBK.prototype.getTransactionResult 	= function(token, callback /* F(error, result)*/){
	var data 	= {
		"tokenInput" 	: token
	};

	this.soapClient.WSWebpayServiceImplService.WSWebpayServiceImplPort.getTransactionResult(data, function(error, result){
		console.log("Result from transbank operation > "+JSON.stringify(result));
	});
};


module.exports 	= TBK;

