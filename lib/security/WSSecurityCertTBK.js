"use strict";

var optional  = require("optional");
var ursa      = optional('ursa'); 
var fs        = require('fs');
var path      = require('path');
var ejs       = require('ejs');
var SignedXml = require('xml-crypto').SignedXml;
var uuid      = require('uuid');
var pem       = require('pem');
var wsseSecurityHeaderTemplate    = ejs.compile(fs.readFileSync(path.join(__dirname, 'templates', 'tbk_header_template.ejs')).toString());
var wsseSecurityTokenTemplate     = ejs.compile(fs.readFileSync(path.join(__dirname, 'templates', 'tbk_token_template.ejs')).toString());

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function dateStringForSOAP(date) {
  return date.getUTCFullYear() + '-' + ('0' + (date.getUTCMonth() + 1)).slice(-2) + '-' +
    ('0' + date.getUTCDate()).slice(-2) + 'T' + ('0' + date.getUTCHours()).slice(-2) + ":" +
    ('0' + date.getUTCMinutes()).slice(-2) + ":" + ('0' + date.getUTCSeconds()).slice(-2) + "Z";
}

function generateCreated() {
  return dateStringForSOAP(new Date());
}

function generateExpires() {
  return dateStringForSOAP(addMinutes(new Date(), 10));
}

function insertStr(src, dst, pos) {
  return [dst.slice(0, pos), src, dst.slice(pos)].join('');
}

function generateId() {
  return uuid.v4().replace(/-/gm, '');
}

function WSSecurityCertTBK(privatePEM, publicP12PEM, password, encoding, debug) {
  if (!ursa) {
    throw new Error('Module ursa must be installed to use WSSecurityCertTBK');
  }
  this.debug              = debug;
  this.privateKey         = ursa.createPrivateKey(privatePEM, password, encoding);
  this.publicP12PEM       = publicP12PEM.toString().replace('-----BEGIN CERTIFICATE-----', '').replace('-----END CERTIFICATE-----', '').replace(/(\r\n|\n|\r)/gm, '');

  this.signer             = new SignedXml();
  this.signer.signingKey  = this.privateKey.toPrivatePem();
  this.x509Id             = "x509-" + generateId();

  var _this = this;
  pem.readCertificateInfo(publicP12PEM,
    function(pemError, pemData){
      if( pemError ){
        console.error("PEM read error, cannot retrieve cert data : "+pemError);
      }

      _this.certSerial    = "";
      if(!Number.isNaN(parseInt(pemData.serial.split(" ")[0])) && pemData.serial.indexOf(":") < 0){
        _this.certSerial = pemData.serial.split(" ")[0];
      }else{
        var tokens  = pemData.serial.split(":");
        for( var i = 0; i < tokens.length; ++i ){
          _this.certSerial  += ""+parseInt("0x"+tokens[i]);
        }
      }
      _this.issuer        = "C="+pemData.issuer.country+",ST="+pemData.issuer.state+",O="+pemData.issuer.organization+",L="+pemData.issuer.locality+",CN="+pemData.commonName+",OU="+pemData.organizationUnit+",emailAddress="+pemData.emailAddress;

      var references = ["http://www.w3.org/2000/09/xmldsig#enveloped-signature",
    "http://www.w3.org/2001/10/xml-exc-c14n#"];

      _this.signer.addReference("//*[local-name(.)='Body']", references);

      _this.signer.keyInfoProvider = {};
      _this.signer.keyInfoProvider.getKeyInfo = function (key) {
        return wsseSecurityTokenTemplate(
          {
            cert            : _this.publicP12PEM,
            serialNumber    : _this.certSerial,
            issuerName      : _this.issuer
          }
        );
      };
    }
  );
};

WSSecurityCertTBK.prototype.postProcess = function (xml) {
  var secHeader = wsseSecurityHeaderTemplate({
    cert            : this.publicP12PEM,
    serialNumber    : this.certSerial,
    issuerName      : this.issuer
  });

  var xmlWithSec  = insertStr(secHeader, xml, xml.indexOf('</soap:Header>'));

  this.signer.computeSignature(xmlWithSec);

  var retXml      = insertStr(this.signer.getSignatureXml(), xmlWithSec, xmlWithSec.indexOf('</wsse:Security>'));

  if( this.debug ){
    console.log("TBK INPUT XML > "+retXml);
  }

  return retXml;
};

module.exports = WSSecurityCertTBK;
