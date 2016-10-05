var Soap 				= require('soap');
var fs  				= require('fs');
var select 				= require('xml-crypto').xpath;
var SignedXml 			= require('xml-crypto').SignedXml;
var FileKeyInfo 		= require('xml-crypto').FileKeyInfo;
var dom 				= require('xmldom').DOMParser;
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

	var wsSecurity 		= new WSSecurityCertTBK(this.privateCert, this.publicCert, '', 'utf8', this.config.DEBUG_LOGS);

	var options = {
     	ignoredNamespaces: {
       		namespaces: [],
       		override: true
     	}
   	};

	this.soapClient 	= null;
	Soap.createClient(
		this.config.WSDL_PATH,
		options,
		function( error, client ){
			if( error ){
				console.error("SOAP Client error > "+error);
			}else{
				self.soapClient 	= client;
				self.soapClient.setSecurity(wsSecurity);

				if( self.config.DEBUG_LOGS ){
					console.log("TBK Client description > "+JSON.stringify(self.soapClient.describe()));
				}
			}
		}
	);
}

TBK.prototype.initTransaction 	= function(amount, buyOrder, sessionId, returnURL, finalURL, callback /*F(error, result)*/) {
	var self 			= this;
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

	this.soapClient.WSWebpayServiceImplService.WSWebpayServiceImplPort.initTransaction(initInput, function(error, result, raw){
		if( self.config.DEBUG_LOGS ){
			console.log("TBK OUTPUT XML > "+raw);
		}

		if( !error && self.verifySignature(raw) ){
			callback(error, result);
		}else{
			callback({message : "Invalid signature or "+error}, result);
		}
	});
};

TBK.prototype.verifySignature 	= function(xml){
	var doc = new dom().parseFromString(xml)    

    var signature 	= select(doc, "//*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']")[0];
    var sig = new SignedXml();
    //Hack to check non-standard transbank SignedInfo node
	sig.__proto__.validateSignatureValue = function() {
	  	var signedInfo = select(doc, "//*[local-name(.)='SignedInfo']");
	  	if (signedInfo.length==0) throw new Error("could not find SignedInfo element in the message");
	  	var signedInfoCanon = this.getCanonXml([this.canonicalizationAlgorithm], signedInfo[0]);
		signedInfoCanon   = signedInfoCanon.toString().replace("xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\"", "xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\" xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\"");
	  	var signer = this.findSignatureAlgorithm(this.signatureAlgorithm);
	  	var res = signer.verifySignature(signedInfoCanon, this.signingKey, this.signatureValue);
	  	if (!res) this.validationErrors.push("invalid signature: the signature value " + this.signatureValue + " is incorrect");
	  	return res
	};

    sig.keyInfoProvider = new FileKeyInfo(this.config.WEBPAY_KEY);
    sig.loadSignature(signature);
    var res = sig.checkSignature(xml);
    if (!res) console.log(sig.validationErrors);
    return res;
};

TBK.prototype.getTransactionResult 	= function(token, callback /* F(error, result)*/){
	var self 			= this;
	var data 	= {
		"tokenInput" 	: token
	};
	var _this 	= this;

	this.soapClient.WSWebpayServiceImplService.WSWebpayServiceImplPort.getTransactionResult(data, function(error, result, raw){
		if( self.config.DEBUG_LOGS ){
			console.log("TBK OUTPUT XML > "+raw);
		}

		if(!error && _this.verifySignature(raw)){
			callback(error, result);
		}else{
			callback({message : "Invalid signature or "+error}, result);
		}
	});
};

TBK.prototype.acknowledgeTransaction = function(token, callback /* F(error, result)*/){
	var self 			= this;
	var data 	= {
		"tokenInput" 	: token
	};

	var _this 	= this;

	this.soapClient.WSWebpayServiceImplService.WSWebpayServiceImplPort.acknowledgeTransaction(data, function(error, result, raw){
		if( self.config.DEBUG_LOGS ){
			console.log("TBK OUTPUT XML > "+raw);
		}

		if(!error && _this.verifySignature(raw)){
			callback(error, result);
		}else{
			callback({message : "Invalid signature or "+error}, result);
		}
	});
}


module.exports 	= TBK;

