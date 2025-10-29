import ChargeRequest from '../../models/ChargeRequest';
import Wallet from '../../models/Wallet';
import {CloudFunction} from '../../utils/Registry/decorators';

class ChargeRequestFunctions {
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        amount: {type: Number, required: true},
        note: {type: String, required: false},
        receipt_image: {type: 'File', required: false},
      },
    },
  })
  async createChargeRequest(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const {amount, note, receipt_image} = req.params;

      if (amount <= 0) {
        throw {codeStatus: 400, message: 'Amount must be greater than zero'};
      }

      const walletQuery = new Parse.Query(Wallet);
      walletQuery.equalTo('user_id', user);
      const wallet = await walletQuery.first({useMasterKey: true});

      if (!wallet) {
        throw {codeStatus: 404, message: 'Wallet not found for this user'};
      }

      const request = new ChargeRequest();
      request.set('wallet_id', wallet);
      request.set('amount', amount);
      request.set('status', 'pending');
      if (note) request.set('note', note);
      if (receipt_image) request.set('receipt_image', receipt_image);

      await request.save(null, {useMasterKey: true});

      return {
        message: 'Charge request created successfully',
        charge_request_id: request.id,
        wallet_id: wallet.id,
        amount,
        status: 'pending',
      };
    } catch (error: any) {
      console.error('Error in createChargeRequest:', error);
      throw {
        codeStatus: error.codeStatus || 1012,
        message: error.message || 'Failed to create charge request',
      };
    }
  }
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        charge_request_id: {type: String, required: true},
      },
    },
  })
  async approveChargeRequest(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const rolePointer = user.get('role');
      if (!rolePointer) {
        throw {codeStatus: 403, message: 'User has no role assigned'};
      }

      const roleQuery = new Parse.Query('_Role');
      const role = await roleQuery.get(rolePointer.id, {useMasterKey: true});
      const roleName = role.get('name')?.toLowerCase().trim();
      const isAdmin = roleName === 'admin';

      if (!isAdmin) {
        throw {
          codeStatus: 403,
          message: 'Only admins can approve charge requests',
        };
      }

      const {charge_request_id} = req.params;

      const requestQuery = new Parse.Query(ChargeRequest);
      requestQuery.include('wallet_id');
      const request = await requestQuery.get(charge_request_id, {
        useMasterKey: true,
      });

      if (!request) {
        throw {codeStatus: 404, message: 'Charge request not found'};
      }

      if (request.get('status') !== 'pending') {
        throw {codeStatus: 400, message: 'Charge request is already processed'};
      }

      const wallet = request.get('wallet_id');
      const amount = request.get('amount');

      const currentBalance = wallet.get('balance') || 0;
      wallet.set('balance', currentBalance + amount);
      await wallet.save(null, {useMasterKey: true});

      request.set('status', 'approved');
      await request.save(null, {useMasterKey: true});

      return {
        message: 'Charge request approved and wallet updated',
        wallet_id: wallet.id,
        new_balance: wallet.get('balance'),
        charge_request_id: request.id,
        status: 'approved',
      };
    } catch (error: any) {
      console.error('Error in approveChargeRequest:', error);
      throw {
        codeStatus: error.codeStatus || 1013,
        message: error.message || 'Failed to approve charge request',
      };
    }
  }
  @CloudFunction({
    methods: ['POST'],
    validation: {
      requireUser: true,
      fields: {
        charge_request_id: {type: String, required: true},
        rejection_note: {type: String, required: true},
      },
    },
  })
  async rejectChargeRequest(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const rolePointer = user.get('role');
      if (!rolePointer) {
        throw {codeStatus: 403, message: 'User has no role assigned'};
      }

      const roleQuery = new Parse.Query('_Role');
      const role = await roleQuery.get(rolePointer.id, {useMasterKey: true});
      const roleName = role.get('name')?.toLowerCase().trim();
      const isAdmin = roleName === 'admin';

      if (!isAdmin) {
        throw {
          codeStatus: 403,
          message: 'Only admins can reject charge requests',
        };
      }

      const {charge_request_id, rejection_note} = req.params;

      const requestQuery = new Parse.Query(ChargeRequest);
      const request = await requestQuery.get(charge_request_id, {
        useMasterKey: true,
      });

      if (!request) {
        throw {codeStatus: 404, message: 'Charge request not found'};
      }

      if (request.get('status') !== 'pending') {
        throw {codeStatus: 400, message: 'Charge request is already processed'};
      }

      request.set('status', 'rejected');
      request.set('rejection_note', rejection_note);
      await request.save(null, {useMasterKey: true});

      return {
        message: 'Charge request rejected',
        charge_request_id: request.id,
        status: 'rejected',
        rejection_note,
      };
    } catch (error: any) {
      console.error('Error in rejectChargeRequest:', error);
      throw {
        codeStatus: error.codeStatus || 1014,
        message: error.message || 'Failed to reject charge request',
      };
    }
  }
  @CloudFunction({
    methods: ['GET'],
    validation: {
      requireUser: true,
      fields: {
        status: {type: String, required: false},
      },
    },
  })
  async getChargeRequests(req: Parse.Cloud.FunctionRequest) {
    try {
      const user = req.user;
      if (!user) {
        throw {codeStatus: 103, message: 'User context is missing'};
      }

      const rolePointer = user.get('role');
      if (!rolePointer) {
        throw {codeStatus: 403, message: 'User has no role assigned'};
      }

      const roleQuery = new Parse.Query('_Role');
      const role = await roleQuery.get(rolePointer.id, {useMasterKey: true});
      const roleName = role.get('name')?.toLowerCase().trim();
      const isAdmin = roleName === 'admin';

      if (!isAdmin) {
        throw {codeStatus: 403, message: 'Only admins can view charge requests'};
      }

      const {status} = req.params;

      const query = new Parse.Query(ChargeRequest);
      query.include(['wallet_id', 'wallet_id.user_id']);
      query.descending('createdAt');

      if (status) {
        query.equalTo('status', status);
      }

      const results = await query.find({useMasterKey: true});

      const formatted = results.map((req) => {
        const wallet = req.get('wallet_id');
        const walletUser = wallet?.get('user_id');
        const username = walletUser?.get('username') || null;

        return {
          charge_request_id: req.id,
          wallet_id: wallet?.id,
          amount: req.get('amount'),
          status: req.get('status'),
          note: req.get('note'),
          rejection_note: req.get('rejection_note') || null,
          createdAt: req.get('createdAt'),
          username,
        };
      });

      return {
        message: 'Charge requests retrieved successfully',
        count: formatted.length,
        requests: formatted,
      };
    } catch (error: any) {
      console.error('Error in getChargeRequests:', error);
      throw {
        codeStatus: error.codeStatus || 1015,
        message: error.message || 'Failed to retrieve charge requests',
      };
    }
  }
}

export default new ChargeRequestFunctions();
