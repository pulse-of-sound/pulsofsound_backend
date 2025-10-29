import WalletTransaction from '../../models/WalletTransaction';
import Wallet from '../../models/Wallet';
import Appointment from '../../models/Appointment';
import {CloudFunction} from '../../utils/Registry/decorators';

class WalletTransactionFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        from_wallet_id: {type: String, required: true},
        to_wallet_id: {type: String, required: true},
        amount: {type: Number, required: true},
        type: {type: String, required: true},
        appointment_id: {type: String, required: false},
      },
    },
  })
  async createWalletTransaction(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const {from_wallet_id, to_wallet_id, amount, type, appointment_id} = req.params;

      if (amount <= 0) {
        throw {codeStatus: 400, message: 'Amount must be greater than zero'};
      }

      const walletQuery = new Parse.Query(Wallet);
      const fromWallet = await walletQuery.get(from_wallet_id, {useMasterKey: true});
      const toWallet = await walletQuery.get(to_wallet_id, {useMasterKey: true});

      if (!fromWallet || !toWallet) {
        throw {codeStatus: 404, message: 'One or both wallets not found'};
      }

      const fromBalance = fromWallet.get('balance') || 0;
      if (fromBalance < amount) {
        throw {codeStatus: 402, message: 'Insufficient balance in source wallet'};
      }

      fromWallet.set('balance', fromBalance - amount);
      const toBalance = toWallet.get('balance') || 0;
      toWallet.set('balance', toBalance + amount);

      await Promise.all([
        fromWallet.save(null, {useMasterKey: true}),
        toWallet.save(null, {useMasterKey: true}),
      ]);

      const transaction = new WalletTransaction();
      transaction.set('from_wallet', fromWallet);
      transaction.set('to_wallet', toWallet);
      transaction.set('amount', amount);
      transaction.set('type', type);

      if (appointment_id) {
        const appointmentQuery = new Parse.Query(Appointment);
        const appointment = await appointmentQuery.get(appointment_id, {useMasterKey: true});
        transaction.set('appointment_id', appointment);
      }

      await transaction.save(null, {useMasterKey: true});

      return {
        message: 'Wallet transaction created successfully',
        transaction_id: transaction.id,
        from_wallet_id,
        to_wallet_id,
        amount,
        type,
      };
    } catch (error: any) {
      console.error('Error in createWalletTransaction:', error);
      throw {
        codeStatus: error.codeStatus || 1016,
        message: error.message || 'Failed to create wallet transaction',
      };
    }
  }
}

export default new WalletTransactionFunctions();
