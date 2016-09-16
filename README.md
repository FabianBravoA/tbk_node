# tbk_node
Transbank node.js module (NOT OFFICIAL)

##Install

    npm install transbank

##Config

If you want to test your transbank implementation, just use the configuration provided by this plugin : 

    var tbk               = require('transbank');
    ...
    var tbkConfig         = tbk.config;
    var TBKObject         0 new tbk.TBK(tbkConfig);
    
This way you will end up with a full working Transbank object, where, through its functions, you can manage all your webpay transactions.

To put your custom credentials, once you are ready to production, overwrite the config object : 
  
    COMMERCE_CODE   : 597020000541, 					  //TBK sample commerce code
    ENVIRONMENT     : 'INTEGRACION',						//TBK debug mode as default
    PRIVATE_KEY     : __dirname + '/certs/private_test_cert.pem',
    PUBLIC_KEY      : __dirname + '/certs/public_test_cert.pem',
    WEBPAY_KEY      : __dirname + '/certs/webpay_test_cert.pem'
    
Also, you can fill those fields using environment variables : 

    export TBK_COMMERCE_CODE=597020000541
    export TBK_ENVIRONMENT=INTEGRACION
    export TBK_PRIVATE_KEY=certs/private_test_cert.pem
    export TBK_PUBLIC_KEY=certs/public_test_cert.pem
    export TBK_WEBPAY_KEY=certs/webpay_test_cert.pem
    
##Methods
To execute any of this methods the TBK object must be initialized. It's not guaranteed to be ready right after you make a new instance of it, so create it at your server start up, or any other place you have to init all main modules of your application.
Also, you don't have to create a new TBK object with every new transaction, just reuse the same object you created at the beggining. THe constructor just initializes the soap client with credentials supplied in the config object or env variables.
###initTransaction

    TBK.initTransaction(amount, buyOrder, sessionId, returnURL, finalURL, callback)
  
WebPay initTransaction, where callback is a function that receives error and result params. If the signature of transbank's response doesn't match with WebPay's certificate, it will come as an error for the callback function too. This applies for any method.

###getTransactionResult
Once you receive the init transaction response, you can call this method using the token included in that response.

    TBK.getTransactionResult(token, callback)

The callback, again, is a function that receives error and result params, in the result param you will find a JSON object with all buyer's data, check transbank documentation for more details about it (the XML response from transbank's servers is automatically transformed into json).

###acknowledgeTransaction
If the payment is accepted, call this method with the token you got from transaction result :

    TBK.acknowledgeTransaction(token, callback)

Remember then redirect the user to 'urlRedirection', field you can find in the JSON obtained through getTransactionResult.


THIS IS NOT AN OFFICIAL PLUGIN FROM TRANSBANK!

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Licenced using LGPL. 

	  
	 
