module.exports 	= {
	WSDL_PATH 			: "https://webpay3gint.transbank.cl/WSWebpayTransaction/cxf/WSWebpayService?wsdl",

	COMMERCE_CODE 		: process.env.TBK_COMMERCE_CODE || 597020000541, 					//TBK sample commerce code
	ENVIRONMENT 		: process.env.TBK_ENVIRONMENT || 'INTEGRACION',						//TBK debug mode as default
	PRIVATE_KEY 		: process.env.TBK_PRIVATE_KEY || __dirname + '/certs/private_test_cert.pem',
	PUBLIC_KEY 			: process.env.TBK_PUBLIC_KEY || __dirname + '/certs/public_test_cert.pem',
	WEBPAY_KEY 			: process.env.TBK_WEBPAY_KEY || __dirname + '/certs/webpay_test_cert.pem'
};