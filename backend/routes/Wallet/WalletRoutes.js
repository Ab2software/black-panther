const express = require('express');
const authmiddleWare = require('../../middleWare/authmiddleWare');
const upload = require('../../middleWare/uploadMiddleware');
const demoGuard = require('../../middleWare/demoGuard')
const { walletController, getWalletController, getScannerController, userUpladPaymentController, userWithdrawController, userWithdrawQrController } = require('../../controllers/Wallet/WalletContoller');

const router = express.Router();

router.post('/add/wallet', authmiddleWare, demoGuard, walletController);


router.get('/get/wallet', authmiddleWare, getWalletController);

router.get('/get/scanner', authmiddleWare, getScannerController);


router.post('/user/payment/upload', upload.single('paymentScreenshot'), demoGuard, authmiddleWare, userUpladPaymentController);
router.post('/user/withdraw', demoGuard, authmiddleWare, userWithdrawController);
router.post(
  '/user/withdraw/qr',
  upload.single('qrImage'),
  demoGuard,
  authmiddleWare,
  userWithdrawQrController
);
module.exports = router;